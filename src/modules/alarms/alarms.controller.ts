import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AlarmsService } from './alarms.service';
import { CreateAlarmDto } from './dto/create-alarm.dto';
import { UpdateAlarmDto } from './dto/update-alarm.dto';
import { FilterAlarmsDto } from './dto/filter-alarms.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('alarms')
@Controller('alarms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AlarmsController {
  constructor(private readonly alarmsService: AlarmsService) {}

  @Post()
  create(@GetUser('id') userId: number, @Body() createAlarmDto: CreateAlarmDto) {
    return this.alarmsService.create(userId, createAlarmDto);
  }

  @Get()
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'building', required: false })
  @ApiQuery({ name: 'floor', required: false })
  @ApiQuery({ name: 'sensorId', required: false })
  @ApiQuery({ name: 'offset', required: false, schema: { default: 0 } })
  @ApiQuery({ name: 'limit', required: false, schema: { default: 100 } })
  findAll(@GetUser('id') userId: number, @Query() filterDto: FilterAlarmsDto) {
    return this.alarmsService.findAll(filterDto, userId);
  }

  @Post('activate-all')
  activateAll(@GetUser('id') userId: number) {
    return this.alarmsService.activateAll(userId);
  }

  @Post('deactivate-all')
  deactivateAll(@GetUser('id') userId: number) {
    return this.alarmsService.deactivateAll(userId);
  }

  @Get(':id')
  findOne(@GetUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.alarmsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAlarmDto: UpdateAlarmDto,
  ) {
    return this.alarmsService.update(id, updateAlarmDto, userId);
  }

  @Delete(':id')
  remove(@GetUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.alarmsService.remove(id, userId);
  }

  @Post(':id/activate')
  activate(@GetUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.alarmsService.activate(id, true, userId);
  }

  @Post(':id/deactivate')
  deactivate(@GetUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.alarmsService.deactivate(id, true, userId);
  }
}
