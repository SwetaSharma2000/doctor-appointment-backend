import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { Doctor } from '../entities/doctor.entity';
import { AuthModule } from '../auth/auth.module'; 
import { DoctorAvailability } from '../entities/doctor-availability.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor,DoctorAvailability]), AuthModule,
],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}