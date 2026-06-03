import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Sensor } from './sensor.entity';
import { Notification } from './notification.entity';
import { Alarm } from './alarm.entity';
import { User } from './user.entity';

export enum EventType {
  SMOKE_DETECTED = 'smoke_detected',
  SMOKE_CLEARED = 'smoke_cleared',
  ALARM_ACTIVATED = 'alarm_activated',
  ALARM_DEACTIVATED = 'alarm_deactivated',
}

@Entity('events')
@Index(['createdAt'])
@Index(['sensorId'])
@Index(['alarmId'])
@Index(['userId'])
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sensor_id', type: 'int', nullable: true })
  sensorId: number;

  @Column({ name: 'alarm_id', type: 'int', nullable: true })
  alarmId: number;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number;

  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  eventType: EventType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Sensor, (sensor) => sensor.events, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sensor_id' })
  sensor: Sensor;

  @ManyToOne(() => Alarm, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'alarm_id' })
  alarm: Alarm;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Notification, (notification) => notification.event)
  notifications: Notification[];
}
