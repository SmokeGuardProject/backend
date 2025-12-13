import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AlarmStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  MALFUNCTION = 'malfunction',
}

@Entity('alarms')
export class Alarm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'alarm_code', unique: true, length: 50 })
  alarmCode: string;

  @Column({ length: 255 })
  location: string;

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
}
