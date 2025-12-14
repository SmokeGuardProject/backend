import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ResolveEventDto {
  @ApiProperty({
    description: 'Коментар щодо вирішення події',
    example: 'Хибна тривога, датчик відкалібровано',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}
