import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Patient } from './patient.entity';
import { Doctor } from './doctor.entity';
import { DoctorAvailability } from './doctor-availability.entity';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  appointment_id!: number;

  @Column({ type: 'int' })
  patient_id!: number;

  @Column({ type: 'int' })
  doctor_id!: number;

  @Column({ type: 'int' })
  availability_id!: number;

  @Column({ type: 'date' })
  appointment_date!: Date;

  @Column({ type: 'time' })
  slot_start_time!: string;

  @Column({ type: 'time' })
  slot_end_time!: string;

  @Column({ type: 'varchar', length: 50 })
  token_number!: string;

  @Column({ type: 'varchar', length: 255 })
  patient_name!: string;  // Can be family member

  @Column({ type: 'varchar', length: 100, default: 'self' })
  patient_relation!: string;  // self, spouse, child, parent

  @Column({ type: 'text', nullable: true })
  complaint!: string | null;

  @Column({ type: 'varchar', length: 50 })
  visit_type!: string;  // first_time, follow_up, report

  @Column({ type: 'varchar', length: 50, default: 'waiting' })
  status!: string;  // waiting, in_consultation, completed, cancelled

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient!: Patient;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctor_id' })
  doctor!: Doctor;

  @ManyToOne(() => DoctorAvailability)
  @JoinColumn({ name: 'availability_id' })
  availability!: DoctorAvailability;
}