import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { User } from './entities/user.entity';
import { Doctor } from './entities/doctor.entity';
import { DoctorsModule } from './doctors/doctors.module';
import { Patient } from './entities/patient.entity';
import { DoctorAvailability } from './entities/doctor-availability.entity';  
import { PatientsModule } from './patients/patients.module';
import { Appointment } from './entities/appointment.entity';
import { AppointmentsModule } from './appointments/appointments.module';



@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Task 3: PostgreSQL connection setup

    TypeOrmModule.forRoot({
     type: 'postgres',
     url: process.env.DATABASE_URL || undefined,

    host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST,
    port: process.env.DATABASE_URL ? undefined : Number(process.env.DB_PORT),
    username: process.env.DATABASE_URL ? undefined : process.env.DB_USER,
    password: process.env.DATABASE_URL ? undefined : process.env.DB_PASS,
    database: process.env.DATABASE_URL ? undefined : process.env.DB_NAME,

  entities: [User, Doctor, Patient, DoctorAvailability, Appointment],
  synchronize: true,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false,
    }),
    AuthModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}