import { ApiProperty } from '@nestjs/swagger';

export class SensorReadingResponseDto {
  @ApiProperty({
    description: 'ID показання',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID датчика',
    example: 1,
  })
  sensorId: number;

  @ApiProperty({
    description: 'Чи виявлено дим',
    example: true,
  })
  smokeDetected: boolean;

  @ApiProperty({
    description: 'Рівень диму (0.00 - 99.99)',
    example: 45.5,
    nullable: true,
  })
  smokeLevel: number | null;

  @ApiProperty({
    description: 'Температура (°C)',
    example: 22.5,
    nullable: true,
  })
  temperature: number | null;

  @ApiProperty({
    description: 'Вологість (%)',
    example: 65.0,
    nullable: true,
  })
  humidity: number | null;

  @ApiProperty({
    description: 'Час вимірювання',
    example: '2025-12-12T09:25:00Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Дата створення запису',
    example: '2025-12-12T09:25:00Z',
  })
  createdAt: Date;
}
