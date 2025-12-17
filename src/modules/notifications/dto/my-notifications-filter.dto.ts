import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class MyNotificationsFilterDto {
  @ApiProperty({
    example: 0,
    required: false,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  offset?: number = 0;

  @ApiProperty({
    example: 100,
    required: false,
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 100;
}
