import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';

@Entity('doctor_availability')
export class DoctorAvailability {
  @PrimaryGeneratedColumn()
  availability_id!: number;

  @Column({ type: 'int' })
  doctor_id!: number;

  @Column({ type: 'simple-array' })
  days_of_week!: string[];  // ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  @Column({ type: 'time' })
  start_time!: string;  // '10:00'

  @Column({ type: 'time' })
  end_time!: string;  // '13:00'

  @Column({ type: 'int', default: 30 })
  duration_minutes!: number;  // 15, 30, 60

  @Column({ type: 'int', default: 1 })
  capacity!: number;  // Max patients per slot

  @Column({ type: 'varchar', length: 50, default: 'stream' })
  schedule_type!: string;  // 'wave' or 'stream'

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctor_id' })
  doctor!: Doctor;
}