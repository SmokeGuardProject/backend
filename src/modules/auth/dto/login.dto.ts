import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email користувача',
    example: 'user@smokeguard.com',
  })
  @IsEmail({}, { message: 'Невалідний формат email' })
  @IsNotEmpty({ message: "Email є обов'язковим" })
  email: string;

  @ApiProperty({
    description: 'Пароль',
    example: 'SecurePass123',
  })
  @IsString()
  @IsNotEmpty({ message: "Пароль є обов'язковим" })
  password: string;
}
