import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAlarmDto {
  @ApiProperty({
    description: 'ID датчика до якого прикріплена сигналізація',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  sensorId: number;

  @ApiProperty({
    description: 'Локація сигналізації',
    example: 'Room 101',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

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
