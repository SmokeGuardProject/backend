import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { FilterEventsDto } from './dto/filter-events.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'offset', required: false, schema: { default: 0 } })
  @ApiQuery({ name: 'limit', required: false, schema: { default: 100 } })
  findAll(@GetUser('id') userId: number, @Query() filterDto: FilterEventsDto) {
    return this.eventsService.findAll(filterDto, userId);
  }

  @Get('statistics')
  getStatistics(@GetUser('id') userId: number) {
    return this.eventsService.getStatistics(userId);
  }

  @Get(':id')
  findOne(@GetUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOne(id, userId);
  }
}
