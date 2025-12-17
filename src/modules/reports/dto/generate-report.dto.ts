import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { EventType } from '../../../database/entities/event.entity';

export class GenerateReportDto {
  @ApiProperty({
    description: 'Start date of the period',
    example: '2025-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date of the period',
    example: '2025-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Sensor ID for filtering',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  sensorId?: number;

  @ApiProperty({
    description: 'Event type for filtering',
    enum: EventType,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;
}
