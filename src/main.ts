import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {MqttService} from "./modules/mqtt/mqtt.service";

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    app.setGlobalPrefix('api');

    const config = new DocumentBuilder()
        .setTitle('SmokeGuard API')
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'JWT',
                description: 'Enter JWT token',
                in: 'header',
            },
            'JWT-auth',
        )
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });

    const port = process.env.PORT || 3000;

    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 SmokeGuard Backend API is running on: http://localhost:${port}/api`);
    logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);


    try {
        const mqttService = app.get(MqttService);
        mqttService.connect();
    } catch (e) {
        logger.error('Failed to initialize MQTT connection', e);
    }
}

bootstrap();