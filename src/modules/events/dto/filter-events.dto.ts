import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EventType } from '../../../database/entities/event.entity';

export class FilterEventsDto {
  @ApiProperty({
    description: 'Фільтр по типу події',
    enum: EventType,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;

  @ApiProperty({
    description: 'Фільтр по статусу вирішення',
    example: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  resolved?: boolean;

  @ApiProperty({
    description: 'Кількість записів для пропуску',
    example: 0,
    required: false,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  offset?: number = 0;

  @ApiProperty({
    description: 'Максимальна кількість записів',
    example: 100,
    required: false,
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 100;
}
