import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Sensor } from './sensor.entity';

@Entity('sensor_readings')
@Index(['sensorId'])
@Index(['timestamp'])
export class SensorReading {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'sensor_id', type: 'int' })
    sensorId: number;

    @Column({ name: 'smoke_detected', type: 'boolean' })
    smokeDetected: boolean;

    @Column({
        name: 'smoke_level',
        type: 'decimal',
        nullable: true,
        precision: 5,
        scale: 2,
    })
    smokeLevel: number | null;

    @Column({ type: 'timestamp' })
    timestamp: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Sensor, (sensor) => sensor.readings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sensor_id' })
    sensor: Sensor;
}
