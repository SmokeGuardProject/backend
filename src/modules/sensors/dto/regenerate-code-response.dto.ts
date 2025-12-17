import { ApiProperty } from '@nestjs/swagger';

export class RegenerateCodeResponseDto {
  @ApiProperty({
    description: 'New secret sensor code. WARNING: Code is returned only once! Old code will become invalid.',
    example: 'b7e2f9a4d3c6e8b5f1a9d7c4e2b8f3a6',
  })
  sensorCode: string;

  @ApiProperty({
    description: 'Повідомлення про успішну регенерацію',
    example: 'Sensor code successfully updated',
  })
  message: string;
}
