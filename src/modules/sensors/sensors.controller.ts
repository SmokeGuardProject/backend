import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SensorsService } from './sensors.service';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { UpdateSensorDto } from './dto/update-sensor.dto';
import { SensorResponseDto } from './dto/sensor-response.dto';
import { CreateSensorResponseDto } from './dto/create-sensor-response.dto';
import { SensorReadingResponseDto } from './dto/sensor-reading-response.dto';
import { GetSensorReadingsQueryDto } from './dto/get-sensor-readings-query.dto';
import { GetSensorsQueryDto } from './dto/get-sensors-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('sensors')
@Controller('sensors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SensorsController {
  constructor(private readonly sensorsService: SensorsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @GetUser('id') userId: number,
    @Body() createSensorDto: CreateSensorDto,
  ): Promise<CreateSensorResponseDto> {
    return this.sensorsService.create(userId, createSensorDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @GetUser('id') userId: number,
    @Query() query: GetSensorsQueryDto,
  ): Promise<SensorResponseDto[]> {
    return this.sensorsService.findAll(userId, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SensorResponseDto> {
    return this.sensorsService.findOne(userId, id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSensorDto: UpdateSensorDto,
  ): Promise<SensorResponseDto> {
    return this.sensorsService.update(userId, id, updateSensorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.sensorsService.remove(userId, id);
  }

  @Get(':id/readings')
  @HttpCode(HttpStatus.OK)
  async getSensorReadings(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: GetSensorReadingsQueryDto,
  ): Promise<SensorReadingResponseDto[]> {
    const filters: any = {
      offset: query.offset,
      limit: query.limit,
    };

    if (query.startDate) {
      filters.startDate = new Date(query.startDate);
    }

    if (query.endDate) {
      filters.endDate = new Date(query.endDate);
    }

    return this.sensorsService.getSensorReadings(userId, id, filters);
  }
}
