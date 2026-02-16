import { 
  Controller, 
  Get, 
  Put, 
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
}