import { ApiProperty } from '@nestjs/swagger';
import { SensorStatus } from '../../../database/entities/sensor.entity';

export class SensorResponseDto {
  @ApiProperty({
    description: 'ID датчика',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Локація датчика',
    example: 'Кімната 101',
  })
  location: string;

  @ApiProperty({
    description: 'Поверх',
    example: 1,
    nullable: true,
  })
  floor: number | null;

  @ApiProperty({
    description: 'Будівля',
    example: 'Корпус А',
    nullable: true,
  })
  building: string | null;

  @ApiProperty({
    description: 'Статус датчика',
    enum: SensorStatus,
    example: SensorStatus.ACTIVE,
  })
  status: SensorStatus;

  @ApiProperty({
    description: 'Час останньої перевірки',
    example: '2025-12-12T09:30:00Z',
    nullable: true,
  })
  lastCheckedAt: Date | null;

  @ApiProperty({
    description: 'Дата створення',
    example: '2025-12-12T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Дата оновлення',
    example: '2025-12-12T10:15:00Z',
  })
  updatedAt: Date;
}
