import { ApiProperty } from '@nestjs/swagger';

export class RegenerateCodeResponseDto {
  @ApiProperty({
    description: 'Новий секретний код датчика. УВАГА: Код повертається тільки один раз! Старий код стане недійсним.',
    example: 'b7e2f9a4d3c6e8b5f1a9d7c4e2b8f3a6',
  })
  sensorCode: string;

  @ApiProperty({
    description: 'Повідомлення про успішну регенерацію',
    example: 'Код датчика успішно оновлено',
  })
  message: string;
}
