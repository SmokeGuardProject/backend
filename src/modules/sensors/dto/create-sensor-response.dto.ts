import { ApiProperty } from '@nestjs/swagger';
import { SensorResponseDto } from './sensor-response.dto';

export class CreateSensorResponseDto {
  @ApiProperty({
    description: 'Created sensor data',
    type: SensorResponseDto,
  })
  sensor: SensorResponseDto;

  @ApiProperty({
    description: 'Secret sensor code for MQTT authentication. WARNING: Code is returned only once during creation! Store it in a secure place.',
    example: 'a3f5e8d9c2b4f7e1a6d8c5b9f2e7a4d1',
  })
  sensorCode: string;
}
