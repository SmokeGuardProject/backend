import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '../../../database/entities/event.entity';

export class CreateEventDto {
  @ApiProperty({
    description: 'ID датчика, що ініціював подію',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sensorId?: number;

  @ApiProperty({
    description: 'ID сигналізації для подій alarm_activated та alarm_deactivated',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  alarmId?: number;

  @ApiProperty({
    description: 'Тип події',
    enum: EventType,
    example: EventType.SMOKE_DETECTED,
  })
  @IsEnum(EventType)
  eventType: EventType;
}
