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
import { User } from './user.entity';
import { Notification } from './notification.entity';

export enum EventType {
  SMOKE_DETECTED = 'smoke_detected',
  ALARM_ACTIVATED = 'alarm_activated',
  ALARM_DEACTIVATED = 'alarm_deactivated',
}

@Entity('events')
@Index(['createdAt'])
@Index(['sensorId'])
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sensor_id', type: 'int', nullable: true })
  sensorId: number;

  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  eventType: EventType;

  @Column({ type: 'boolean', default: false })
  resolved: boolean;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ name: 'resolved_by', type: 'int', nullable: true })
  resolvedById: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Sensor, (sensor) => sensor.events, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sensor_id' })
  sensor: Sensor;

  @ManyToOne(() => User, (user) => user.resolvedEvents)
  @JoinColumn({ name: 'resolved_by' })
  resolvedBy: User;

  @OneToMany(() => Notification, (notification) => notification.event)
  notifications: Notification[];
}
