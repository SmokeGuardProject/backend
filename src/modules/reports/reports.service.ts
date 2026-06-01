import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Event, EventType } from '../../database/entities/event.entity';
import { Sensor, SensorStatus } from '../../database/entities/sensor.entity';
import { Alarm, AlarmStatus } from '../../database/entities/alarm.entity';
import { GenerateReportDto } from './dto/generate-report.dto';
import PDFDocument = require('pdfkit');

const COLORS = {
  green: '#16a34a',
  greenSoft: '#dcfce7',
  red: '#dc2626',
  redSoft: '#fee2e2',
  yellow: '#d97706',
  yellowSoft: '#fef3c7',
  text: '#172033',
  muted: '#667085',
  border: '#d0d5dd',
  header: '#f2f4f7',
  row: '#f9fafb',
  white: '#ffffff',
};

const PAGE = {
  margin: 36,
  width: 595.28,
  height: 841.89,
  bottom: 72,
};

const EVENT_LIMIT = 50;

interface ReportEvent {
  id: number;
  label: string;
  color: string;
  background: string;
  location: string;
  sensorLabel: string;
  createdAt: Date;
  eventType: EventType | string;
}

interface TableColumn<T> {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right' | 'justify';
  render: (row: T) => string;
  color?: (row: T) => string;
}

@Injectable()
export class ReportsService {
  private regularFontName = 'ReportRegular';
  private boldFontName = 'ReportBold';

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
    @InjectRepository(Alarm)
    private readonly alarmRepository: Repository<Alarm>,
  ) {}

  async generateReport(dto: GenerateReportDto): Promise<Buffer> {
    const [sensors, events, alarms] = await Promise.all([
      this.fetchSensors(dto),
      this.fetchEvents(dto),
      this.fetchAlarms(dto),
    ]);

    return this.createComprehensivePDF(sensors, events, alarms, dto);
  }

  private async fetchSensors(dto: GenerateReportDto): Promise<Sensor[]> {
    const whereConditions: Partial<Sensor> = {};

    if (dto.sensorId) {
      whereConditions.id = dto.sensorId;
    }

    return this.sensorRepository.find({
      where: whereConditions,
      relations: ['events', 'alarms'],
      order: { id: 'ASC' },
    });
  }

  private async fetchEvents(dto: GenerateReportDto): Promise<Event[]> {
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.sensor', 'sensor')
      .leftJoinAndSelect('event.alarm', 'alarm')
      .leftJoinAndSelect('alarm.sensor', 'alarmSensor');

    if (dto.startDate && dto.endDate) {
      queryBuilder.andWhere('event.created_at BETWEEN :startDate AND :endDate', {
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      });
    } else if (dto.startDate) {
      queryBuilder.andWhere('event.created_at >= :startDate', {
        startDate: new Date(dto.startDate),
      });
    } else if (dto.endDate) {
      queryBuilder.andWhere('event.created_at <= :endDate', {
        endDate: new Date(dto.endDate),
      });
    }

    if (dto.sensorId) {
      queryBuilder.andWhere('(event.sensor_id = :sensorId OR alarm.sensor_id = :sensorId)', {
        sensorId: dto.sensorId,
      });
    }

    if (dto.eventType) {
      queryBuilder.andWhere('event.event_type = :eventType', {
        eventType: dto.eventType,
      });
    }

    return queryBuilder.orderBy('event.created_at', 'DESC').getMany();
  }

  private async fetchAlarms(dto: GenerateReportDto): Promise<Alarm[]> {
    const queryBuilder = this.alarmRepository
      .createQueryBuilder('alarm')
      .leftJoinAndSelect('alarm.sensor', 'sensor');

    if (dto.sensorId) {
      queryBuilder.andWhere('alarm.sensor_id = :sensorId', {
        sensorId: dto.sensorId,
      });
    }

    return queryBuilder.orderBy('alarm.id', 'ASC').getMany();
  }

  private createComprehensivePDF(
    sensors: Sensor[],
    rawEvents: Event[],
    alarms: Alarm[],
    dto: GenerateReportDto,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: PAGE.margin,
        size: 'A4',
        bufferPages: true,
        info: {
          Title: 'SmokeGuard - Звіт системи виявлення задимлення',
          Author: 'SmokeGuard',
        },
      });

      this.registerFonts(doc);

      const chunks: Buffer[] = [];
      const events = rawEvents
        .map((event) => this.toReportEvent(event))
        .filter((event): event is ReportEvent => Boolean(event));

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.addCoverHeader(doc, dto);
      this.addSummary(doc, sensors, events, alarms);
      this.addEventStatistics(doc, events);
      this.addSensorsSection(doc, sensors);
      this.addAlarmsSection(doc, alarms);
      this.addEventsSection(doc, events);
      this.addFooter(doc);

      doc.end();
    });
  }

  private registerFonts(doc: PDFKit.PDFDocument): void {
    this.regularFontName = 'ReportRegular';
    this.boldFontName = 'ReportBold';

    const regular = this.resolveFontPath('DejaVuSans.ttf');
    const bold = this.resolveFontPath('DejaVuSans-Bold.ttf');

    doc.registerFont(this.regularFontName, regular);
    doc.registerFont(this.boldFontName, bold);
    doc.font(this.regularFontName);
  }

  private resolveFontPath(filename: string): string {
    const candidates = [
      path.resolve(process.cwd(), 'src/assets/fonts', filename),
      path.resolve(process.cwd(), 'dist/assets/fonts', filename),
      path.resolve(__dirname, '../../assets/fonts', filename),
      path.resolve(__dirname, '../../../src/assets/fonts', filename),
    ];
    const fontPath = candidates.find((candidate) => fs.existsSync(candidate));

    if (!fontPath) {
      throw new Error(
        `Report font "${filename}" was not found. Expected it in src/assets/fonts or dist/assets/fonts.`,
      );
    }

    return fontPath;
  }

  private regularFont(): string {
    return this.regularFontName;
  }

  private boldFont(): string {
    return this.boldFontName;
  }

  private addCoverHeader(doc: PDFKit.PDFDocument, dto: GenerateReportDto): void {
    const y = PAGE.margin;

    doc.roundedRect(PAGE.margin, y, PAGE.width - PAGE.margin * 2, 116, 8).fill(COLORS.green);

    doc
      .font(this.boldFont())
      .fontSize(26)
      .fillColor(COLORS.white)
      .text('SmokeGuard', PAGE.margin + 24, y + 22, { width: 250 });

    doc
      .font(this.regularFont())
      .fontSize(13)
      .fillColor(COLORS.white)
      .text('Звіт системи виявлення задимлення', PAGE.margin + 24, y + 58, { width: 250 });

    const metaX = PAGE.margin + 256;
    doc.fontSize(9).fillColor('#ecfdf3');
    this.metaLine(doc, metaX, y + 22, 'Звіт сформовано', this.formatDateTime(new Date()));
    this.metaLine(doc, metaX, y + 42, 'Період звіту', this.formatPeriod(dto));
    this.metaLine(
      doc,
      metaX,
      y + 62,
      'Сенсор',
      dto.sensorId ? `Сенсор #${dto.sensorId}` : 'Усі сенсори',
    );
    this.metaLine(
      doc,
      metaX,
      y + 82,
      'Тип подій',
      dto.eventType ? this.eventLabel(dto.eventType).label : 'Усі типи подій',
    );

    doc.y = y + 138;
  }

  private metaLine(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    label: string,
    value: string,
  ): void {
    doc.font(this.regularFont()).fontSize(8.5).text(`${label}: ${value}`, x, y, { width: 266 });
  }

  private addSummary(
    doc: PDFKit.PDFDocument,
    sensors: Sensor[],
    events: ReportEvent[],
    alarms: Alarm[],
  ): void {
    const criticalEvents = events.filter((event) =>
      [
        EventType.SMOKE_DETECTED,
        EventType.ALARM_ACTIVATED,
        'smoke detected',
        'alarm activated',
      ].includes(event.eventType as EventType),
    ).length;

    const cards = [
      { label: 'Усього сенсорів', value: sensors.length, color: COLORS.green },
      { label: 'Усього сигналізацій', value: alarms.length, color: COLORS.yellow },
      { label: 'Усього подій', value: events.length, color: COLORS.text },
      { label: 'Критичних подій', value: criticalEvents, color: COLORS.red },
    ];

    const cardWidth = 124;
    const cardHeight = 68;
    const gap = 11;
    let x = PAGE.margin;
    const y = doc.y;

    cards.forEach((card) => {
      doc.roundedRect(x, y, cardWidth, cardHeight, 8).fillAndStroke(COLORS.white, COLORS.border);
      doc.rect(x, y, cardWidth, 5).fill(card.color);
      doc
        .font(this.boldFont())
        .fontSize(24)
        .fillColor(card.color)
        .text(String(card.value), x, y + 16, { width: cardWidth, align: 'center' });
      doc
        .font(this.regularFont())
        .fontSize(8.5)
        .fillColor(COLORS.muted)
        .text(card.label, x + 8, y + 47, { width: cardWidth - 16, align: 'center' });
      x += cardWidth + gap;
    });

    doc.y = y + cardHeight + 18;

    const conclusion =
      criticalEvents === 0
        ? 'За вибраний період критичних подій не зафіксовано.'
        : `За вибраний період зафіксовано ${criticalEvents} критичних подій.`;

    doc
      .roundedRect(PAGE.margin, doc.y, PAGE.width - PAGE.margin * 2, 42, 8)
      .fillAndStroke(
        criticalEvents === 0 ? COLORS.greenSoft : COLORS.redSoft,
        criticalEvents === 0 ? '#86efac' : '#fecaca',
      );
    doc
      .font(this.boldFont())
      .fontSize(11)
      .fillColor(criticalEvents === 0 ? COLORS.green : COLORS.red)
      .text('Короткий висновок', PAGE.margin + 16, doc.y + 9);
    doc
      .font(this.regularFont())
      .fontSize(10)
      .fillColor(COLORS.text)
      .text(conclusion, PAGE.margin + 16, doc.y + 24);

    doc.y += 62;
  }

  private addEventStatistics(doc: PDFKit.PDFDocument, events: ReportEvent[]): void {
    this.addSectionTitle(doc, 'Статистика подій');

    const stats = [
      {
        label: 'Виявлено дим',
        value: this.countEvents(events, EventType.SMOKE_DETECTED),
        color: COLORS.red,
      },
      {
        label: 'Дим зник',
        value: this.countEvents(events, EventType.SMOKE_CLEARED),
        color: COLORS.green,
      },
      {
        label: 'Сигналізація активована',
        value: this.countEvents(events, EventType.ALARM_ACTIVATED),
        color: COLORS.red,
      },
      {
        label: 'Сигналізація деактивована',
        value: this.countEvents(events, EventType.ALARM_DEACTIVATED),
        color: COLORS.yellow,
      },
    ];

    const rowHeight = 26;
    const tableWidth = PAGE.width - PAGE.margin * 2;
    const headerY = doc.y;
    this.drawTableHeader(
      doc,
      PAGE.margin,
      headerY,
      tableWidth,
      rowHeight,
      ['Тип події', 'Кількість'],
      [380, 143],
    );
    doc.y = headerY + rowHeight;

    stats.forEach((stat, index) => {
      const rowY = doc.y;
      this.drawRowBackground(doc, PAGE.margin, rowY, tableWidth, rowHeight, index);
      doc
        .font(this.boldFont())
        .fontSize(9)
        .fillColor(stat.color)
        .text(stat.label, PAGE.margin + 10, rowY + 8, { width: 360 });
      doc
        .font(this.boldFont())
        .fillColor(COLORS.text)
        .text(String(stat.value), PAGE.margin + 390, rowY + 8, { width: 120, align: 'center' });
      doc.y = rowY + rowHeight;
    });

    doc.y += 18;
  }

  private addSensorsSection(doc: PDFKit.PDFDocument, sensors: Sensor[]): void {
    this.ensureSpace(doc, 120);
    this.addSectionTitle(doc, 'Стан сенсорів');

    if (sensors.length === 0) {
      this.addEmptyState(doc, 'Сенсорів за вибраними фільтрами не знайдено.');
      return;
    }

    this.drawTable(doc, sensors, [
      { header: 'ID', width: 34, render: (sensor) => `#${sensor.id}` },
      { header: 'Локація', width: 210, render: (sensor) => this.formatLocation(sensor) },
      {
        header: 'Поверх',
        width: 54,
        align: 'center',
        render: (sensor) => this.formatFloor(sensor.floor),
      },
      {
        header: 'Статус',
        width: 74,
        render: (sensor) => this.statusLabel(sensor.status),
        color: (sensor) => (sensor.status === SensorStatus.ACTIVE ? COLORS.green : COLORS.muted),
      },
      {
        header: 'Кількість подій',
        width: 78,
        align: 'center',
        render: (sensor) => String(sensor.events?.length ?? 0),
      },
      {
        header: 'Сигналізацій',
        width: 73,
        align: 'center',
        render: (sensor) => String(sensor.alarms?.length ?? 0),
      },
    ]);

    doc.y += 18;
  }

  private addAlarmsSection(doc: PDFKit.PDFDocument, alarms: Alarm[]): void {
    this.ensureSpace(doc, 120);
    this.addSectionTitle(doc, 'Стан сигналізацій');

    if (alarms.length === 0) {
      this.addEmptyState(doc, 'Сигналізацій за вибраними фільтрами не знайдено.');
      return;
    }

    this.drawTable(doc, alarms, [
      { header: 'ID', width: 34, render: (alarm) => `#${alarm.id}` },
      { header: 'Локація', width: 178, render: (alarm) => this.formatLocation(alarm) },
      {
        header: 'Поверх',
        width: 54,
        align: 'center',
        render: (alarm) => this.formatFloor(alarm.floor),
      },
      {
        header: 'Статус',
        width: 70,
        render: (alarm) => this.statusLabel(alarm.status),
        color: (alarm) => (alarm.status === AlarmStatus.ACTIVE ? COLORS.red : COLORS.muted),
      },
      {
        header: 'Прив’язаний сенсор',
        width: 92,
        render: (alarm) => (alarm.sensorId ? `Сенсор #${alarm.sensorId}` : 'Не прив’язано'),
      },
      {
        header: 'Остання активація',
        width: 95,
        render: (alarm) => (alarm.activatedAt ? this.formatDateTime(alarm.activatedAt) : 'Не було'),
      },
    ]);

    doc.y += 18;
  }

  private addEventsSection(doc: PDFKit.PDFDocument, events: ReportEvent[]): void {
    this.ensureSpace(doc, 120);
    this.addSectionTitle(doc, 'Журнал подій');

    if (events.length === 0) {
      this.addEmptyState(doc, 'Подій із повним контекстом за вибраними фільтрами не знайдено.');
      return;
    }

    const visibleEvents = events.slice(0, EVENT_LIMIT);

    this.drawTable(doc, visibleEvents, [
      { header: 'ID', width: 34, render: (event) => `#${event.id}` },
      {
        header: 'Тип події',
        width: 126,
        render: (event) => event.label,
        color: (event) => event.color,
      },
      { header: 'Локація', width: 190, render: (event) => event.location },
      { header: 'Сенсор', width: 74, render: (event) => event.sensorLabel },
      { header: 'Час', width: 99, render: (event) => this.formatDateTime(event.createdAt) },
    ]);

    doc
      .font(this.regularFont())
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(`Показано ${visibleEvents.length} із ${events.length} подій.`, PAGE.margin, doc.y + 6);
  }

  private drawTable<T>(doc: PDFKit.PDFDocument, rows: T[], columns: TableColumn<T>[]): void {
    const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
    const rowHeight = 34;

    this.ensureSpace(doc, rowHeight * 2);

    let headerY = doc.y;
    this.drawTableHeader(
      doc,
      PAGE.margin,
      headerY,
      tableWidth,
      rowHeight,
      columns.map((column) => column.header),
      columns.map((column) => column.width),
    );
    doc.y = headerY + rowHeight;

    rows.forEach((row, index) => {
      this.ensureSpace(doc, rowHeight + 8);

      if (doc.y < 80) {
        headerY = doc.y;
        this.drawTableHeader(
          doc,
          PAGE.margin,
          headerY,
          tableWidth,
          rowHeight,
          columns.map((column) => column.header),
          columns.map((column) => column.width),
        );
        doc.y = headerY + rowHeight;
      }

      const rowY = doc.y;
      this.drawRowBackground(doc, PAGE.margin, rowY, tableWidth, rowHeight, index);

      let x = PAGE.margin;
      columns.forEach((column) => {
        doc
          .font(column.color ? this.boldFont() : this.regularFont())
          .fontSize(7.5)
          .fillColor(column.color?.(row) ?? COLORS.text)
          .text(column.render(row), x + 6, rowY + 8, {
            width: column.width - 12,
            height: rowHeight - 10,
            align: column.align ?? 'left',
            ellipsis: true,
          });

        x += column.width;
      });

      doc.y = rowY + rowHeight;
    });
  }

  private drawTableHeader(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    headers: string[],
    columnWidths: number[],
  ): void {
    doc.rect(x, y, width, height).fillAndStroke(COLORS.header, COLORS.border);

    let currentX = x;
    headers.forEach((header, index) => {
      doc
        .font(this.boldFont())
        .fontSize(7.5)
        .fillColor(COLORS.text)
        .text(header, currentX + 6, y + 11, {
          width: columnWidths[index] - 12,
          height: height - 12,
        });

      currentX += columnWidths[index];
      if (index < headers.length - 1) {
        doc
          .moveTo(currentX, y)
          .lineTo(currentX, y + height)
          .strokeColor(COLORS.border)
          .stroke();
      }
    });
  }

  private drawRowBackground(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    index: number,
  ): void {
    doc
      .rect(x, y, width, height)
      .fillAndStroke(index % 2 === 0 ? COLORS.white : COLORS.row, COLORS.border);
  }

  private addSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    doc.font(this.boldFont()).fontSize(14).fillColor(COLORS.text).text(title, PAGE.margin, doc.y);

    doc
      .moveTo(PAGE.margin, doc.y + 6)
      .lineTo(PAGE.width - PAGE.margin, doc.y + 6)
      .strokeColor(COLORS.green)
      .lineWidth(1.5)
      .stroke();
    doc.y += 16;
  }

  private addEmptyState(doc: PDFKit.PDFDocument, message: string): void {
    doc
      .roundedRect(PAGE.margin, doc.y, PAGE.width - PAGE.margin * 2, 36, 8)
      .fillAndStroke(COLORS.row, COLORS.border);
    doc
      .font(this.regularFont())
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text(message, PAGE.margin + 14, doc.y + 12);
    doc.y += 54;
  }

  private addFooter(doc: PDFKit.PDFDocument): void {
    const range = doc.bufferedPageRange();

    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);

      doc
        .moveTo(PAGE.margin, PAGE.height - 52)
        .lineTo(PAGE.width - PAGE.margin, PAGE.height - 52)
        .strokeColor(COLORS.border)
        .lineWidth(0.5)
        .stroke();

      doc
        .font(this.regularFont())
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(`SmokeGuard — сторінка ${i + 1} з ${range.count}`, PAGE.margin, PAGE.height - 48, {
          width: PAGE.width - PAGE.margin * 2,
          height: 10,
          align: 'center',
          lineBreak: false,
        });
    }
  }

  private ensureSpace(doc: PDFKit.PDFDocument, neededHeight: number): void {
    if (doc.y + neededHeight > PAGE.height - PAGE.bottom) {
      doc.addPage();
      doc.y = PAGE.margin;
    }
  }

  private toReportEvent(event: Event): ReportEvent | null {
    const details = this.eventLabel(event.eventType);
    const isAlarmEvent = [
      EventType.ALARM_ACTIVATED,
      EventType.ALARM_DEACTIVATED,
      'alarm activated',
      'alarm deactivated',
    ].includes(event.eventType as EventType);
    const locationSource = isAlarmEvent ? event.alarm : event.sensor;
    const sensor = isAlarmEvent ? (event.alarm?.sensor ?? event.sensor) : event.sensor;

    if (!locationSource || !sensor) {
      return null;
    }

    const location = this.formatLocation(locationSource);
    if (!location) {
      return null;
    }

    return {
      id: event.id,
      label: details.label,
      color: details.color,
      background: details.background,
      location,
      sensorLabel: `Сенсор #${sensor.id}`,
      createdAt: event.createdAt,
      eventType: event.eventType,
    };
  }

  private eventLabel(eventType: EventType | string): {
    label: string;
    color: string;
    background: string;
  } {
    const normalized = String(eventType).trim().toLowerCase().replace(/ /g, '_');

    switch (normalized) {
      case EventType.SMOKE_DETECTED:
        return { label: 'Виявлено дим', color: COLORS.red, background: COLORS.redSoft };
      case EventType.SMOKE_CLEARED:
        return { label: 'Дим зник', color: COLORS.green, background: COLORS.greenSoft };
      case EventType.ALARM_ACTIVATED:
        return { label: 'Сигналізація активована', color: COLORS.red, background: COLORS.redSoft };
      case EventType.ALARM_DEACTIVATED:
        return {
          label: 'Сигналізація деактивована',
          color: COLORS.yellow,
          background: COLORS.yellowSoft,
        };
      default:
        return { label: 'Невідомий тип події', color: COLORS.muted, background: COLORS.row };
    }
  }

  private countEvents(events: ReportEvent[], type: EventType): number {
    return events.filter((event) => String(event.eventType).replace(/ /g, '_') === type).length;
  }

  private formatLocation(entity: Pick<Sensor | Alarm, 'building' | 'floor' | 'location'>): string {
    const parts = [
      entity.building?.trim(),
      entity.floor !== null && entity.floor !== undefined ? `Поверх ${entity.floor}` : null,
      entity.location?.trim(),
    ].filter(Boolean);

    return parts.join(' / ');
  }

  private formatFloor(floor: number | null | undefined): string {
    return floor === null || floor === undefined ? 'Не вказано' : String(floor);
  }

  private statusLabel(status: SensorStatus | AlarmStatus | string): string {
    return status === 'active' ? 'Активний' : 'Неактивний';
  }

  private formatDateTime(value: Date | string): string {
    return new Intl.DateTimeFormat('uk-UA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value));
  }

  private formatDate(value: string): string {
    const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const date = dateOnly
      ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
      : new Date(value);

    return new Intl.DateTimeFormat('uk-UA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  private formatPeriod(dto: GenerateReportDto): string {
    if (dto.startDate && dto.endDate) {
      return `${this.formatDate(dto.startDate)} — ${this.formatDate(dto.endDate)}`;
    }

    if (dto.startDate) {
      return `з ${this.formatDate(dto.startDate)}`;
    }

    if (dto.endDate) {
      return `до ${this.formatDate(dto.endDate)}`;
    }

    return 'Увесь період';
  }
}
