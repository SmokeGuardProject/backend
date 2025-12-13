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

@ApiTags('sensors')
@Controller('sensors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SensorsController {
  constructor(private readonly sensorsService: SensorsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSensorDto: CreateSensorDto): Promise<CreateSensorResponseDto> {
    return this.sensorsService.create(createSensorDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: GetSensorsQueryDto): Promise<SensorResponseDto[]> {
    return this.sensorsService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<SensorResponseDto> {
    return this.sensorsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSensorDto: UpdateSensorDto,
  ): Promise<SensorResponseDto> {
    return this.sensorsService.update(id, updateSensorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.sensorsService.remove(id);
  }

  @Get(':id/readings')
  @HttpCode(HttpStatus.OK)
  async getSensorReadings(
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

    return this.sensorsService.getSensorReadings(id, filters);
  }
}
