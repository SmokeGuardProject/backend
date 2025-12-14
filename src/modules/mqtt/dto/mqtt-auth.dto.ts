import { IsString, IsNotEmpty } from 'class-validator';

export class MqttAuthDto {
  @IsString()
  @IsNotEmpty()
  clientid: string;

  @IsString()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
