import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { SensorStatus } from '../../../database/entities/sensor.entity';

export class GetSensorsQueryDto {
  @ApiProperty({ required: false, enum: SensorStatus })
  @IsOptional()
  @IsEnum(SensorStatus)
  status?: SensorStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floor?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  building?: string;
}
