import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Appointment } from '../entities/appointment.entity';
import { DoctorAvailability } from '../entities/doctor-availability.entity';
import { Doctor } from '../entities/doctor.entity';
import { AuthModule } from '../auth/auth.module';
import { Patient } from '../entities/patient.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, DoctorAvailability, Doctor,Patient,]),
    AuthModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}