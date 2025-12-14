import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SensorReading } from './sensor-reading.entity';
import { Event } from './event.entity';
import { User } from './user.entity';
import { Alarm } from './alarm.entity';

export enum SensorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('sensors')
export class Sensor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ name: 'sensor_code', unique: true, length: 60 })
  sensorCodeHash: string;

  @Column({ length: 255 })
  location: string;

  @Column({ nullable: true, type: 'int' })
  floor: number;

  @Column({ length: 100, nullable: true })
  building: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: SensorStatus.INACTIVE,
  })
  status: SensorStatus;

  @Column({ name: 'last_checked_at', nullable: true, type: 'timestamp' })
  lastCheckedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.sensors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => SensorReading, (reading) => reading.sensor)
  readings: SensorReading[];

  @OneToMany(() => Event, (event) => event.sensor)
  events: Event[];

  @OneToMany(() => Alarm, (alarm) => alarm.sensor)
  alarms: Alarm[];
}
