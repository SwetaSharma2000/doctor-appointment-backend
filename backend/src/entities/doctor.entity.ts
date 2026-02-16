import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn()
doctor_id!: number;

@Column({ type: 'int', unique: true })
user_id!: number;

@Column({ type: 'varchar', length: 255 })
name!: string;

@Column({ type: 'varchar', length: 255, nullable: true })
specialization!: string | null;

@Column({ type: 'int', default: 0 })
experience_years!: number;

@Column({ type: 'boolean', default: false })
is_verified!: boolean;

@Column({
  type: 'varchar',
  length: 50,
  default: 'pending',
})
verification_status!: string;

@Column({ type: 'boolean', default: true })
is_available!: boolean;

@CreateDateColumn()
created_at!: Date;

@UpdateDateColumn()
updated_at!: Date;

@OneToOne(() => User)
@JoinColumn({ name: 'user_id' })
user!: User;
}