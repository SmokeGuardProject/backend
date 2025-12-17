import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { User } from '../../database/entities/user.entity';
import { Event, EventType } from '../../database/entities/event.entity';
import { MyNotificationsFilterDto } from './dto/my-notifications-filter.dto';
import { NOTIFICATION_MESSAGES } from './constants/notification-messages.constants';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createNotificationsForEvent(event: Event): Promise<void> {
    const message = this.generateMessageForEvent(event);

    if (!event.sensor?.userId) {
      return;
    }

    const notification = this.notificationRepository.create({
      userId: event.sensor.userId,
      eventId: event.id,
      message,
      sentAt: new Date(),
    });

    await this.notificationRepository.save(notification);
  }

  async findAllForUser(
    userId: number,
    filterDto: MyNotificationsFilterDto,
  ): Promise<Notification[]> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.event', 'event')
      .leftJoinAndSelect('event.sensor', 'sensor')
      .where('notification.user_id = :userId', { userId });

    queryBuilder.orderBy('notification.created_at', 'DESC');

    if (filterDto.offset) {
      queryBuilder.offset(filterDto.offset);
    }

    if (filterDto.limit) {
      queryBuilder.limit(filterDto.limit);
    }

    return queryBuilder.getMany();
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true },
    );
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  private generateMessageForEvent(event: Event): string {
    const location =
      event.sensor?.location || NOTIFICATION_MESSAGES.UNKNOWN_LOCATION;

    switch (event.eventType) {
      case EventType.SMOKE_DETECTED:
        return NOTIFICATION_MESSAGES.SMOKE_DETECTED(location);
      case EventType.SMOKE_CLEARED:
        return NOTIFICATION_MESSAGES.SMOKE_CLEARED(location);
      case EventType.ALARM_ACTIVATED:
        return NOTIFICATION_MESSAGES.ALARM_ACTIVATED(location);
      case EventType.ALARM_DEACTIVATED:
        return NOTIFICATION_MESSAGES.ALARM_DEACTIVATED(location);
      default:
        return NOTIFICATION_MESSAGES.DEFAULT_EVENT(location);
    }
  }
}
