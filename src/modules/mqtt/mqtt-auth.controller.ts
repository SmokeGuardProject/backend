import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MqttAuthDto } from './dto/mqtt-auth.dto';
import { MqttAclDto } from './dto/mqtt-acl.dto';
import { SensorsService } from '../sensors/sensors.service';

@ApiTags('mqtt')
@Controller('mqtt')
export class MqttAuthController {
    private readonly logger = new Logger(MqttAuthController.name);
    private readonly backendUsername: string;
    private readonly backendPassword: string;

    constructor(
        private readonly sensorsService: SensorsService,
        private readonly configService: ConfigService,
    ) {
        this.backendUsername = this.configService.get<string>('MQTT_USERNAME', 'backend-smokeguard');
        this.backendPassword = this.configService.get<string>('MQTT_PASSWORD', 'backend-secret-change-in-production');
    }


    @Post('auth')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Authenticate MQTT client (EMQX hook)' })
    @ApiResponse({ status: 200, description: 'Authentication successful' })
    @ApiResponse({ status: 401, description: 'Authentication failed' })
    async authenticate(@Body() authDto: MqttAuthDto): Promise<Record<string, any>> {


        if (authDto.clientid === 'backend-smokeguard') {
            const isValid =
                authDto.username === this.backendUsername &&
                authDto.password === this.backendPassword;

            if (!isValid) {
                this.logger.warn(`Auth Failed: Backend credentials invalid`);
                throw new UnauthorizedException('Invalid backend credentials');
            }

            this.logger.log('✅ Backend client authenticated successfully');



            return { result: 'allow', is_superuser: true };
        }


        const sensorId = parseInt(authDto.clientid, 10);

        if (isNaN(sensorId)) {
            this.logger.warn(`Auth Failed: Invalid clientid format "${authDto.clientid}"`);
            throw new UnauthorizedException('Invalid clientid format');
        }

        const isValid = await this.sensorsService.validateSensorCode(
            sensorId,
            authDto.password,
        );

        if (!isValid) {
            this.logger.warn(`Auth Failed: Invalid credentials for sensor ${sensorId}`);
            throw new UnauthorizedException('Invalid sensor credentials');
        }

        this.logger.log(`✅ Sensor ${sensorId} authenticated successfully`);


        return { result: 'allow', is_superuser: false };
    }


    @Post('acl')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Check MQTT permissions (EMQX hook)' })
    @ApiResponse({ status: 200, description: 'Action allowed' })
    @ApiResponse({ status: 403, description: 'Action denied' })
    async checkAcl(@Body() aclDto: MqttAclDto): Promise<Record<string, any>> {
        const { clientid, topic, action } = aclDto;



        if (clientid === 'backend-smokeguard') {
            return { result: 'allow' };
        }


        const sensorId = parseInt(clientid, 10);
        if (isNaN(sensorId)) {
            throw new ForbiddenException();
        }

        const allowed = this.isTopicAllowed(sensorId, topic, action);

        if (!allowed) {
            this.logger.warn(`⛔ ACL Denied (Sensor ${sensorId}): ${action} on ${topic}`);
            throw new ForbiddenException();
        }

        return { result: 'allow' };
    }



    private isTopicAllowed(sensorId: number, topic: string, action: 'publish' | 'subscribe'): boolean {

        if (action === 'publish') {
            const allowedPublishTopics = [
                `sensors/${sensorId}/data`,
                `sensors/${sensorId}/heartbeat`,
                `sensors/${sensorId}/status`,
            ];
            return allowedPublishTopics.includes(topic);
        }

        if (action === 'subscribe') {
            const allowedSubscribeTopics = [
                `sensors/${sensorId}/commands`,
                `alarms/+/activate`,
                `alarms/+/deactivate`,
            ];
            return this.matchTopic(allowedSubscribeTopics, topic);
        }

        return false;
    }

    private matchTopic(patterns: string[], topic: string): boolean {
        return patterns.some((pattern) => {
            if (pattern === topic) return true;
            const regexStr = '^' + pattern
                    .replace(/\+/g, '[^/]+')
                    .replace(/#/g, '.*')
                + '$';
            const regex = new RegExp(regexStr);
            return regex.test(topic);
        });
    }
}