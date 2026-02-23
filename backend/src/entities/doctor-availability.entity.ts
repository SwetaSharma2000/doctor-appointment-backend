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

  @Column({ type: 'varchar', length: 50 })
  availability_type!: string;  // 'recurring' or 'custom'

  // For recurring
  @Column({ type: 'simple-array', nullable: true })
  days_of_week!: string[] | null;

  // For custom
  @Column({ type: 'date', nullable: true })
  specific_date!: Date | null;

  // Session info
  @Column({ type: 'varchar', length: 50, nullable: true })
  timeOfDay!: string | null;  // 'morning', 'evening', 'afternoon'

  @Column({ type: 'time' })
  start_time!: string;

  @Column({ type: 'time' })
  end_time!: string;

  // Scheduling
  @Column({ type: 'varchar', length: 50 })
  scheduling_type!: string;  // 'wave' or 'stream'

  @Column({ type: 'int', nullable: true })
  duration_minutes!: number | null;  // Only for wave

  @Column({ type: 'int' })
  capacity!: number;  // Stream=total, Wave=per slot

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