import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class MqttAclDto {
  @IsString()
  @IsNotEmpty()
  clientid: string;

  @IsString()
  username: string;

  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['publish', 'subscribe'])
  action: 'publish' | 'subscribe';
}
