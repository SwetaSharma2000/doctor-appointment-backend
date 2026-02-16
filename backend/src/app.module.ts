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
import { PatientsModule } from './patients/patients.module';


@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Task 3: PostgreSQL connection setup

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [User,Doctor,Patient],
      synchronize: true,
    }),
    AuthModule,
    DoctorsModule,
    PatientsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}