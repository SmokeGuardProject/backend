import {
    Controller,
    Get,
    Param,
    Query,
    ParseIntPipe,
    UseGuards,
    Request,
    Patch,
    Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { FilterEventsDto } from './dto/filter-events.dto';
import { ResolveEventDto } from './dto/resolve-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'resolved', required: false })
  @ApiQuery({ name: 'offset', required: false, schema: { default: 0 } })
  @ApiQuery({ name: 'limit', required: false, schema: { default: 100 } })
  findAll(@Query() filterDto: FilterEventsDto) {
    return this.eventsService.findAll(filterDto);
  }

  @Get('statistics')
  getStatistics() {
    return this.eventsService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id/resolve')
  resolve(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() resolveDto: ResolveEventDto,
  ) {
    return this.eventsService.resolve(id, req.user.id);
  }
}
