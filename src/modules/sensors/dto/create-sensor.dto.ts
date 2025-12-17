import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, IsOptional, IsInt, Min } from 'class-validator';

export class CreateSensorDto {
  @ApiProperty({
    description: 'Локація датчика',
    example: 'Room 101',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty({ message: "Локація є обов'язковою" })
  @MinLength(3, { message: 'Локація має містити мінімум 3 символи' })
  location: string;

  @ApiProperty({
    description: 'Поверх',
    example: 1,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: 'Поверх має бути цілим числом' })
  @Min(0, { message: 'Поверх не може бути від\'ємним' })
  floor?: number;

  @ApiProperty({
    description: 'Будівля',
    example: 'Building A',
    required: false,
  })
  @IsOptional()
  @IsString()
  building?: string;
}
