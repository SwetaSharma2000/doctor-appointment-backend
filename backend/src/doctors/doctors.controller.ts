import { 
  Controller, 
  Get, 
  Put,
  Post,
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) {}

  // Get own doctor profile (authenticated doctor only)
  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getMyProfile(@Request() req) {
    console.log('🚀 Doctors profile endpoint hit!'); 
    return this.doctorsService.getDoctorProfile(req.user.user_id);
  }

  // Update own doctor profile (authenticated doctor only)
  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateMyProfile(
    @Request() req,
    @Body() body: {
      specialization?: string;
      experience_years?: number;
    }
  ) {
    // Check if user is actually a doctor
    if (req.user.role !== 'doctor') {
      return { 
        statusCode: 403,
        message: 'Only doctors can update doctor profile' 
      };
    }

    return this.doctorsService.updateDoctorProfile(req.user.user_id, body);
  }

  // Admin: Get all doctors
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getAllDoctors(@Request() req) {
    // In production, add admin role check here
    return this.doctorsService.getAllDoctors();
  }

  // Admin: Verify doctor
  @Put(':id/verify')
  @UseGuards(AuthGuard('jwt'))
  async verifyDoctor(
    @Param('id', ParseIntPipe) doctorId: number,
    @Body() body: {
      status: 'active' | 'rejected';
    }
  ) {
    // In production, add admin role check here
    return this.doctorsService.verifyDoctor(doctorId, body.status);
  }

  // Create availability
  @Post('availability')
  @UseGuards(AuthGuard('jwt'))
  async createAvailability(
    @Request() req,
    @Body() body: {
      days_of_week: string[];
      start_time: string;
      end_time: string;
      duration_minutes: number;
      capacity: number;
      schedule_type: string;
    }
  ) {
    // Check if user is a doctor
    if (req.user.role !== 'doctor') {
      return {
        statusCode: 403,
        message: 'Only doctors can create availability',
      };
    }

    // Get doctor_id from user
    const doctor = await this.doctorsService.getDoctorProfile(req.user.user_id);

    return this.doctorsService.createAvailability(doctor.doctor_id, body);
  }

  // Get own availability
  @Get('availability')
  @UseGuards(AuthGuard('jwt'))
  async getMyAvailability(@Request() req) {
    // Get doctor_id from user
    const doctor = await this.doctorsService.getDoctorProfile(req.user.user_id);
    
    return this.doctorsService.getDoctorAvailability(doctor.doctor_id);
  }

  // Update availability
  @Put('availability/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateAvailability(
    @Request() req,
    @Param('id', ParseIntPipe) availabilityId: number,
    @Body() body: {
      days_of_week?: string[];
      start_time?: string;
      end_time?: string;
      duration_minutes?: number;
      capacity?: number;
      schedule_type?: string;
    }
  ) {
    if (req.user.role !== 'doctor') {
      return {
        statusCode: 403,
        message: 'Only doctors can update availability',
      };
    }

    return this.doctorsService.updateAvailability(availabilityId, body);
  }

  // Delete availability
  @Delete('availability/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteAvailability(
    @Request() req,
    @Param('id', ParseIntPipe) availabilityId: number,
  ) {
    if (req.user.role !== 'doctor') {
      return {
        statusCode: 403,
        message: 'Only doctors can delete availability',
      };
    }

    return this.doctorsService.deleteAvailability(availabilityId);
  }
}