import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Email користувача',
    example: 'user@smokeguard.com',
  })
  @IsEmail({}, { message: 'Невалідний формат email' })
  @IsNotEmpty({ message: "Email є обов'язковим" })
  email: string;

  @ApiProperty({
    description: 'Пароль (мінімум 6 символів)',
    example: 'SecurePass123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Пароль має містити мінімум 6 символів' })
  @IsNotEmpty({ message: "Пароль є обов'язковим" })
  password: string;

  @ApiProperty({
    description: "Повне ім'я користувача",
    example: 'Іван Петренко',
  })
  @IsString()
  @IsNotEmpty({ message: "Повне ім'я є обов'язковим" })
  fullName: string;
}
