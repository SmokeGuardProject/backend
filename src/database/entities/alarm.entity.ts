import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sensor } from './sensor.entity';

export enum AlarmStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
}

@Entity('alarms')
export class Alarm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sensor_id', type: 'int' })
  sensorId: number;

  @Column({ length: 255 })
  location: string;

  @Column({ nullable: true, type: 'int' })
  floor: number;

  @Column({ length: 100, nullable: true })
  building: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  status: AlarmStatus;

  @Column({ name: 'activated_at', type: 'timestamp', nullable: true })
  activatedAt: Date;

  @Column({ name: 'deactivated_at', type: 'timestamp', nullable: true })
  deactivatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Sensor, (sensor) => sensor.alarms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sensor_id' })
  sensor: Sensor;
}
