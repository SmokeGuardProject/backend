import { ApiProperty } from '@nestjs/swagger';

class UserResponseDto {
  @ApiProperty({ description: 'ID користувача', example: 1 })
  id: number;

  @ApiProperty({ description: 'Email', example: 'user@smokeguard.com' })
  email: string;

  @ApiProperty({ description: "Повне ім'я", example: 'John Doe' })
  fullName: string;

  @ApiProperty({
    description: 'Дата створення',
    example: '2025-12-12T10:00:00Z',
  })
  createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT токен доступу',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({ description: 'Дані користувача', type: UserResponseDto })
  user: UserResponseDto;
}
