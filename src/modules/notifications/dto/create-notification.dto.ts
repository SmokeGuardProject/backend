import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID користувача',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({
    description: 'ID події',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  eventId: number;

  @ApiProperty({
    description: 'Текст повідомлення',
    example: 'Smoke detected in the room',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
