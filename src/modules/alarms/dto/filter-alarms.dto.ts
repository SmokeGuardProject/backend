import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { AlarmStatus } from '../../../database/entities/alarm.entity';

export class FilterAlarmsDto {
  @ApiProperty({
    description: 'Фільтр по статусу сигналізації',
    enum: AlarmStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(AlarmStatus)
  status?: AlarmStatus;

  @ApiProperty({
    description: 'Фільтр по будівлі',
    example: 'Building A',
    required: false,
  })
  @IsOptional()
  @IsString()
  building?: string;

  @ApiProperty({
    description: 'Фільтр по поверху',
    example: 3,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floor?: number;

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
