import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentsService } from './appointments.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../entities/doctor.entity';

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private appointmentsService: AppointmentsService,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
  ) {}

  // PATIENT: Book appointment
  @Post()
  @UseGuards(AuthGuard('jwt'))
  async bookAppointment(
    @Request() req,
    @Body() body: {
      doctor_id: number;
      availability_id: number;
      appointment_date: string;
      slot_start_time: string;
      slot_end_time: string;
      patient_name: string;
      patient_relation: string;
      complaint?: string;
      visit_type: string;
    }
  ) {
    if (req.user.role !== 'patient') {
      throw new BadRequestException('Only patients can book appointments');
    }

    return this.appointmentsService.bookAppointment(req.user.user_id, body);
  }

  // PATIENT: Get my appointments
  @Get('my-appointments')
  @UseGuards(AuthGuard('jwt'))
  async getMyAppointments(@Request() req) {
    if (req.user.role !== 'patient') {
      throw new BadRequestException('Only patients can view their appointments');
    }

    return this.appointmentsService.getPatientAppointments(req.user.user_id);
  }

  // DOCTOR: Get doctor's appointments
  @Get('doctor-appointments')
  @UseGuards(AuthGuard('jwt'))
  async getDoctorAppointments(
    @Request() req,
    @Query('date') date?: string,
  ) {
    if (req.user.role !== 'doctor') {
      throw new BadRequestException('Only doctors can view doctor appointments');
    }

    // Get doctor_id from user_id
    const doctor = await this.doctorRepository.findOne({
      where: { user_id: req.user.user_id },
    });

    if (!doctor) {
      throw new BadRequestException('Doctor profile not found');
    }

    return this.appointmentsService.getDoctorAppointments(doctor.doctor_id, date);
  }

  // DOCTOR: Update appointment status
  @Put(':id/status')
  @UseGuards(AuthGuard('jwt'))
  async updateAppointmentStatus(
    @Request() req,
    @Param('id', ParseIntPipe) appointmentId: number,
    @Body() body: { status: string },
  ) {
    if (req.user.role !== 'doctor') {
      throw new BadRequestException('Only doctors can update appointment status');
    }

    return this.appointmentsService.updateAppointmentStatus(appointmentId, body.status);
  }

  // BOTH: Cancel appointment
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async cancelAppointment(
    @Request() req,
    @Param('id', ParseIntPipe) appointmentId: number,
  ) {
    return this.appointmentsService.cancelAppointment(
       req.user.user_id,
       req.user.role,
      appointmentId,
    );
  }
}