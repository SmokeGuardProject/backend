import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Event, EventType } from '../../database/entities/event.entity';
import { Sensor } from '../../database/entities/sensor.entity';
import { Alarm } from '../../database/entities/alarm.entity';
import { GenerateReportDto } from './dto/generate-report.dto';
import PDFDocument = require('pdfkit');

@Injectable()
export class ReportsService {
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
    const whereConditions: any = {};

    if (dto.sensorId) {
      whereConditions.id = dto.sensorId;
    }

    return this.sensorRepository.find({
      where: whereConditions,
      relations: ['events', 'alarms'],
      order: { createdAt: 'DESC' },
    });
  }

  private async fetchEvents(dto: GenerateReportDto): Promise<Event[]> {
    const whereConditions: any = {};

    if (dto.startDate && dto.endDate) {
      whereConditions.createdAt = Between(new Date(dto.startDate), new Date(dto.endDate));
    } else if (dto.startDate) {
      whereConditions.createdAt = MoreThanOrEqual(new Date(dto.startDate));
    } else if (dto.endDate) {
      whereConditions.createdAt = LessThanOrEqual(new Date(dto.endDate));
    }

    if (dto.sensorId) {
      whereConditions.sensorId = dto.sensorId;
    }

    if (dto.eventType) {
      whereConditions.eventType = dto.eventType;
    }

    return this.eventRepository.find({
      where: whereConditions,
      relations: ['sensor'],
      order: { createdAt: 'DESC' },
    });
  }

  private async fetchAlarms(dto: GenerateReportDto): Promise<Alarm[]> {
    const queryBuilder = this.alarmRepository
      .createQueryBuilder('alarm')
      .leftJoinAndSelect('alarm.sensor', 'sensor');

    if (dto.startDate && dto.endDate) {
      queryBuilder.andWhere('alarm.created_at BETWEEN :startDate AND :endDate', {
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      });
    } else if (dto.startDate) {
      queryBuilder.andWhere('alarm.created_at >= :startDate', {
        startDate: new Date(dto.startDate),
      });
    } else if (dto.endDate) {
      queryBuilder.andWhere('alarm.created_at <= :endDate', {
        endDate: new Date(dto.endDate),
      });
    }

    if (dto.sensorId) {
      queryBuilder.andWhere('alarm.sensor_id = :sensorId', {
        sensorId: dto.sensorId,
      });
    }

    return queryBuilder.orderBy('alarm.created_at', 'DESC').getMany();
  }

  private createComprehensivePDF(
    sensors: Sensor[],
    events: Event[],
    alarms: Alarm[],
    dto: GenerateReportDto,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        info: {
          Title: 'SmokeGuard System Report',
          Author: 'SmokeGuard System',
        },
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.addHeader(doc);
      this.addOverviewSection(doc, sensors, events, alarms, dto);
      this.addSensorsSection(doc, sensors);
      this.addEventsSection(doc, events);
      this.addAlarmsSection(doc, alarms);
      this.addFooter(doc);

      doc.end();
    });
  }

  private addHeader(doc: PDFKit.PDFDocument): void {
    doc
      .fontSize(28)
      .fillColor('#1a1a1a')
      .font('Helvetica-Bold')
      .text('SMOKEGUARD', { align: 'center' });

    doc
      .fontSize(14)
      .fillColor('#666666')
      .font('Helvetica')
      .text('Fire Detection & Evacuation System', { align: 'center' });

    doc.moveDown(0.5);

    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .lineWidth(2)
      .strokeColor('#e74c3c')
      .stroke();

    doc.moveDown(1.5);
  }

  private addOverviewSection(
    doc: PDFKit.PDFDocument,
    sensors: Sensor[],
    events: Event[],
    alarms: Alarm[],
    dto: GenerateReportDto,
  ): void {
    doc
      .fontSize(20)
      .fillColor('#2c3e50')
      .font('Helvetica-Bold')
      .text('System Overview', { underline: true });

    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .fillColor('#7f8c8d')
      .font('Helvetica')
      .text(`Report Generated: ${new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'medium'
      })}`);

    if (dto.startDate || dto.endDate) {
      const start = dto.startDate ? new Date(dto.startDate).toLocaleDateString('en-US') : 'N/A';
      const end = dto.endDate ? new Date(dto.endDate).toLocaleDateString('en-US') : 'N/A';
      doc.text(`Report Period: ${start} - ${end}`);
    }

    doc.moveDown(1);

    const statsY = doc.y;
    const boxWidth = 150;
    const boxHeight = 80;
    const spacing = 20;

    this.drawStatBox(doc, 50, statsY, boxWidth, boxHeight, sensors.length.toString(), 'Total Sensors', '#3498db');
    this.drawStatBox(doc, 50 + boxWidth + spacing, statsY, boxWidth, boxHeight, events.length.toString(), 'Total Events', '#e67e22');
    this.drawStatBox(doc, 50 + (boxWidth + spacing) * 2, statsY, boxWidth, boxHeight, alarms.length.toString(), 'Total Alarms', '#e74c3c');

    doc.y = statsY + boxHeight + 20;

    const activeSensors = sensors.filter(s => s.status === 'active').length;
    const activeAlarms = alarms.filter(a => a.status === 'active').length;
    const criticalEvents = events.filter(e => e.eventType === EventType.SMOKE_DETECTED).length;

    doc.fontSize(12).fillColor('#2c3e50').font('Helvetica-Bold').text('Key Metrics');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#34495e').font('Helvetica');
    doc.text(`Active Sensors: ${activeSensors} / ${sensors.length}`);
    doc.text(`Active Alarms: ${activeAlarms} / ${alarms.length}`);
    doc.text(`Critical Events (Smoke Detected): ${criticalEvents}`);

    doc.moveDown(1.5);
    this.addSectionDivider(doc);
  }

  private addSensorsSection(doc: PDFKit.PDFDocument, sensors: Sensor[]): void {
    doc
      .fontSize(20)
      .fillColor('#2c3e50')
      .font('Helvetica-Bold')
      .text('Sensors Status', { underline: true });

    doc.moveDown(0.5);

    if (sensors.length === 0) {
      doc.fontSize(10).fillColor('#95a5a6').font('Helvetica-Oblique').text('No sensors found');
      doc.moveDown(1.5);
      this.addSectionDivider(doc);
      return;
    }

    const statusCounts = sensors.reduce((acc, sensor) => {
      acc[sensor.status] = (acc[sensor.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    doc.fontSize(11).fillColor('#34495e').font('Helvetica-Bold').text('Status Distribution:');
    doc.fontSize(10).font('Helvetica');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const color = status === 'active' ? '#27ae60' : status === 'inactive' ? '#95a5a6' : '#e74c3c';
      doc.fillColor(color).text(`  ${status.toUpperCase()}: ${count}`, { continued: false });
    });

    doc.moveDown(1);

    this.drawSensorsTable(doc, sensors);

    doc.moveDown(1.5);
    this.addSectionDivider(doc);
  }

  private drawSensorsTable(doc: PDFKit.PDFDocument, sensors: Sensor[]): void {
    const tableTop = doc.y;
    const rowHeight = 25;
    const colWidths = [50, 150, 80, 60, 60, 60];
    const tableLeft = 50;

    doc.fontSize(9).fillColor('#ecf0f1').font('Helvetica-Bold');
    doc.rect(tableLeft, tableTop, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#34495e');

    doc.fillColor('#ffffff');
    let xPos = tableLeft + 5;
    ['ID', 'Location', 'Status', 'Floor', 'Events', 'Alarms'].forEach((header, i) => {
      doc.text(header, xPos, tableTop + 8, { width: colWidths[i], align: 'left' });
      xPos += colWidths[i];
    });

    let yPos = tableTop + rowHeight;
    doc.fillColor('#2c3e50').font('Helvetica');

    sensors.slice(0, 20).forEach((sensor, index) => {
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      const bgColor = index % 2 === 0 ? '#ecf0f1' : '#ffffff';
      doc.rect(tableLeft, yPos, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(bgColor);

      doc.fillColor('#2c3e50');
      xPos = tableLeft + 5;

      doc.text(sensor.id.toString(), xPos, yPos + 8, { width: colWidths[0], align: 'left' });
      xPos += colWidths[0];

      doc.text(sensor.location, xPos, yPos + 8, { width: colWidths[1], align: 'left' });
      xPos += colWidths[1];

      const statusColor = sensor.status === 'active' ? '#27ae60' : sensor.status === 'inactive' ? '#95a5a6' : '#e74c3c';
      doc.fillColor(statusColor).text(sensor.status, xPos, yPos + 8, { width: colWidths[2], align: 'left' });
      doc.fillColor('#2c3e50');
      xPos += colWidths[2];

      doc.text(sensor.floor?.toString() || 'N/A', xPos, yPos + 8, { width: colWidths[3], align: 'center' });
      xPos += colWidths[3];

      doc.text(sensor.events?.length.toString() || '0', xPos, yPos + 8, { width: colWidths[4], align: 'center' });
      xPos += colWidths[4];

      doc.text(sensor.alarms?.length.toString() || '0', xPos, yPos + 8, { width: colWidths[5], align: 'center' });

      yPos += rowHeight;
    });

    doc.y = yPos + 10;

    if (sensors.length > 20) {
      doc.fontSize(8).fillColor('#95a5a6').font('Helvetica-Oblique')
        .text(`Showing first 20 sensors out of ${sensors.length} total`);
    }
  }

  private addEventsSection(doc: PDFKit.PDFDocument, events: Event[]): void {
    if (doc.y > 650) {
      doc.addPage();
    }

    doc
      .fontSize(20)
      .fillColor('#2c3e50')
      .font('Helvetica-Bold')
      .text('Events Log', { underline: true });

    doc.moveDown(0.5);

    if (events.length === 0) {
      doc.fontSize(10).fillColor('#95a5a6').font('Helvetica-Oblique').text('No events found');
      doc.moveDown(1.5);
      this.addSectionDivider(doc);
      return;
    }

    const eventTypeCounts = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<EventType, number>);

    doc.fontSize(11).fillColor('#34495e').font('Helvetica-Bold').text('Event Type Statistics:');
    doc.fontSize(10).font('Helvetica');

    Object.entries(eventTypeCounts).forEach(([type, count]) => {
      const color = type === EventType.SMOKE_DETECTED ? '#e74c3c' :
                    type === EventType.ALARM_ACTIVATED ? '#e67e22' :
                    type === EventType.ALARM_DEACTIVATED ? '#27ae60' : '#3498db';
      doc.fillColor(color).text(`  ${type.replace(/_/g, ' ')}: ${count}`);
    });

    doc.moveDown(1);

    this.drawEventsTable(doc, events);

    doc.moveDown(1.5);
    this.addSectionDivider(doc);
  }

  private drawEventsTable(doc: PDFKit.PDFDocument, events: Event[]): void {
    const tableTop = doc.y;
    const rowHeight = 25;
    const colWidths = [50, 120, 150, 140];
    const tableLeft = 50;

    doc.fontSize(9).fillColor('#ecf0f1').font('Helvetica-Bold');
    doc.rect(tableLeft, tableTop, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#34495e');

    doc.fillColor('#ffffff');
    let xPos = tableLeft + 5;
    ['ID', 'Event Type', 'Sensor', 'Timestamp'].forEach((header, i) => {
      doc.text(header, xPos, tableTop + 8, { width: colWidths[i], align: 'left' });
      xPos += colWidths[i];
    });

    let yPos = tableTop + rowHeight;
    doc.fillColor('#2c3e50').font('Helvetica');

    events.slice(0, 25).forEach((event, index) => {
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      const bgColor = index % 2 === 0 ? '#ecf0f1' : '#ffffff';
      doc.rect(tableLeft, yPos, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(bgColor);

      doc.fillColor('#2c3e50');
      xPos = tableLeft + 5;

      doc.text(event.id.toString(), xPos, yPos + 8, { width: colWidths[0], align: 'left' });
      xPos += colWidths[0];

      const typeColor = event.eventType === EventType.SMOKE_DETECTED ? '#e74c3c' : '#3498db';
      doc.fillColor(typeColor).text(event.eventType.replace(/_/g, ' '), xPos, yPos + 8, { width: colWidths[1], align: 'left' });
      doc.fillColor('#2c3e50');
      xPos += colWidths[1];

      doc.text(event.sensor?.location || 'N/A', xPos, yPos + 8, { width: colWidths[2], align: 'left' });
      xPos += colWidths[2];

      doc.text(new Date(event.createdAt).toLocaleString('en-US'), xPos, yPos + 8, { width: colWidths[3], align: 'left' });

      yPos += rowHeight;
    });

    doc.y = yPos + 10;

    if (events.length > 25) {
      doc.fontSize(8).fillColor('#95a5a6').font('Helvetica-Oblique')
        .text(`Showing first 25 events out of ${events.length} total`);
    }
  }

  private addAlarmsSection(doc: PDFKit.PDFDocument, alarms: Alarm[]): void {
    if (doc.y > 650) {
      doc.addPage();
    }

    doc
      .fontSize(20)
      .fillColor('#2c3e50')
      .font('Helvetica-Bold')
      .text('Alarms History', { underline: true });

    doc.moveDown(0.5);

    if (alarms.length === 0) {
      doc.fontSize(10).fillColor('#95a5a6').font('Helvetica-Oblique').text('No alarms found');
      doc.moveDown(1.5);
      return;
    }

    const activeCount = alarms.filter(a => a.status === 'active').length;
    const inactiveCount = alarms.filter(a => a.status === 'inactive').length;

    doc.fontSize(11).fillColor('#34495e').font('Helvetica-Bold').text('Alarm Status:');
    doc.fontSize(10).font('Helvetica');
    doc.fillColor('#e74c3c').text(`  ACTIVE: ${activeCount}`);
    doc.fillColor('#95a5a6').text(`  INACTIVE: ${inactiveCount}`);

    doc.moveDown(1);

    this.drawAlarmsTable(doc, alarms);
  }

  private drawAlarmsTable(doc: PDFKit.PDFDocument, alarms: Alarm[]): void {
    const tableTop = doc.y;
    const rowHeight = 30;
    const colWidths = [40, 130, 70, 60, 120];
    const tableLeft = 50;

    doc.fontSize(9).fillColor('#ecf0f1').font('Helvetica-Bold');
    doc.rect(tableLeft, tableTop, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#34495e');

    doc.fillColor('#ffffff');
    let xPos = tableLeft + 5;
    ['ID', 'Location', 'Status', 'Floor', 'Last Activated'].forEach((header, i) => {
      doc.text(header, xPos, tableTop + 10, { width: colWidths[i], align: 'left' });
      xPos += colWidths[i];
    });

    let yPos = tableTop + rowHeight;
    doc.fillColor('#2c3e50').font('Helvetica');

    alarms.slice(0, 20).forEach((alarm, index) => {
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      const bgColor = index % 2 === 0 ? '#ecf0f1' : '#ffffff';
      doc.rect(tableLeft, yPos, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(bgColor);

      doc.fillColor('#2c3e50');
      xPos = tableLeft + 5;

      doc.text(alarm.id.toString(), xPos, yPos + 10, { width: colWidths[0], align: 'left' });
      xPos += colWidths[0];

      doc.text(alarm.location, xPos, yPos + 10, { width: colWidths[1], align: 'left' });
      xPos += colWidths[1];

      const statusColor = alarm.status === 'active' ? '#e74c3c' : '#95a5a6';
      doc.fillColor(statusColor).text(alarm.status.toUpperCase(), xPos, yPos + 10, { width: colWidths[2], align: 'left' });
      doc.fillColor('#2c3e50');
      xPos += colWidths[2];

      doc.text(alarm.floor?.toString() || 'N/A', xPos, yPos + 10, { width: colWidths[3], align: 'center' });
      xPos += colWidths[3];

      const activated = alarm.activatedAt ? new Date(alarm.activatedAt).toLocaleString('en-US') : 'Never';
      doc.fontSize(8).text(activated, xPos, yPos + 10, { width: colWidths[4], align: 'left' });
      doc.fontSize(9);

      yPos += rowHeight;
    });

    doc.y = yPos + 10;

    if (alarms.length > 20) {
      doc.fontSize(8).fillColor('#95a5a6').font('Helvetica-Oblique')
        .text(`Showing first 20 alarms out of ${alarms.length} total`);
    }
  }

  private drawStatBox(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    value: string,
    label: string,
    color: string,
  ): void {
    doc.rect(x, y, width, height).lineWidth(1).strokeColor('#bdc3c7').stroke();

    doc.rect(x, y, width, 5).fill(color);

    doc
      .fontSize(32)
      .fillColor(color)
      .font('Helvetica-Bold')
      .text(value, x, y + 20, { width, align: 'center' });

    doc
      .fontSize(11)
      .fillColor('#7f8c8d')
      .font('Helvetica')
      .text(label, x, y + 58, { width, align: 'center' });
  }

  private addSectionDivider(doc: PDFKit.PDFDocument): void {
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .lineWidth(1)
      .strokeColor('#bdc3c7')
      .stroke();

    doc.moveDown(1.5);
  }

  private addFooter(doc: PDFKit.PDFDocument): void {
    const range = doc.bufferedPageRange();

    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);

      doc
        .fontSize(8)
        .fillColor('#95a5a6')
        .text(
          `SmokeGuard System Report - Page ${i + 1} of ${range.count}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
    }
  }
}
