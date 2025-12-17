import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { MyNotificationsFilterDto } from './dto/my-notifications-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('my')
  @ApiQuery({ name: 'offset', required: false, schema: { default: 0 } })
  @ApiQuery({ name: 'limit', required: false, schema: { default: 100 } })
  getMyNotifications(@Request() req, @Query() filterDto: MyNotificationsFilterDto) {
    return this.notificationsService.findAllForUser(req.user.id, filterDto);
  }

  @Get('unread-count')
  getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Patch('read-all')
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }
}
