import { ApiProperty } from '@nestjs/swagger';
import { SensorResponseDto } from './sensor-response.dto';

export class CreateSensorResponseDto {
  @ApiProperty({
    description: 'Дані створеного датчика',
    type: SensorResponseDto,
  })
  sensor: SensorResponseDto;

  @ApiProperty({
    description: 'Секретний код датчика для MQTT аутентифікації. УВАГА: Код повертається тільки один раз при створенні! Збережіть його у безпечному місці.',
    example: 'a3f5e8d9c2b4f7e1a6d8c5b9f2e7a4d1',
  })
  sensorCode: string;
}
