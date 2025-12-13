import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsDateString } from 'class-validator';

export class GetSensorReadingsQueryDto {
  @ApiProperty({ required: true, default: 0 })
  @Type(() => Number)
  @IsInt()
  offset: number = 0;

  @ApiProperty({ required: true, default: 100 })
  @Type(() => Number)
  @IsInt()
  limit: number = 100;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
