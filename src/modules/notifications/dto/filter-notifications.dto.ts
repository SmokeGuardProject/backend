import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FilterNotificationsDto {
  @ApiProperty({
    description: 'ID користувача',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiProperty({
    description: 'Фільтр по статусу прочитання',
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
  read?: boolean;

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
