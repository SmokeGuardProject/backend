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

@ApiTags('alarms')
@Controller('alarms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AlarmsController {
  constructor(private readonly alarmsService: AlarmsService) {}

  @Post()
  create(@Body() createAlarmDto: CreateAlarmDto) {
    return this.alarmsService.create(createAlarmDto);
  }

  @Get()
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'offset', required: false, schema: { default: 0 } })
  @ApiQuery({ name: 'limit', required: false, schema: { default: 100 } })
  findAll(@Query() filterDto: FilterAlarmsDto) {
    return this.alarmsService.findAll(filterDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.alarmsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAlarmDto: UpdateAlarmDto,
  ) {
    return this.alarmsService.update(id, updateAlarmDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.alarmsService.remove(id);
  }

  @Post(':id/activate')
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.alarmsService.activate(id);
  }

  @Post(':id/deactivate')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.alarmsService.deactivate(id);
  }
}
