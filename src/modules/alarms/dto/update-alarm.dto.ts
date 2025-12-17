import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAlarmDto {
  @ApiProperty({
    description: 'Локація сигналізації',
    example: 'Room 101',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'Поверх',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floor?: number;

  @ApiProperty({
    description: 'Будівля',
    example: 'Building A',
    required: false,
  })
  @IsOptional()
  @IsString()
  building?: string;
}
