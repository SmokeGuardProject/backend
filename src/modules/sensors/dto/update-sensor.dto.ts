import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, MinLength, IsEnum } from 'class-validator';
import { SensorStatus } from '../../../database/entities/sensor.entity';

export class UpdateSensorDto {
  @ApiProperty({
    description: 'Локація датчика',
    example: 'Кімната 102',
    required: false,
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Локація має містити мінімум 3 символи' })
  location?: string;

  @ApiProperty({
    description: 'Поверх',
    example: 2,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: 'Поверх має бути цілим числом' })
  @Min(0, { message: 'Поверх не може бути від\'ємним' })
  floor?: number;

  @ApiProperty({
    description: 'Будівля',
    example: 'Корпус Б',
    required: false,
  })
  @IsOptional()
  @IsString()
  building?: string;

  @ApiProperty({
    description: 'Статус датчика',
    enum: SensorStatus,
    example: SensorStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(SensorStatus, { message: 'Невалідний статус датчика' })
  status?: SensorStatus;
}
