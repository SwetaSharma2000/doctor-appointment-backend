import { 
  Controller, 
  Get, 
  Put,
  Post,
  Delete, 
  Body, 
  Param, 
  Query, 
  BadRequestException, 
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
    availability_type: 'recurring' | 'custom';
    days_of_week?: string[];
    specific_date?: string;
    timeOfDay?: string;
    start_time: string;
    end_time: string;
    scheduling_type: 'wave' | 'stream';
    duration_minutes?: number;
    capacity: number;
  }
) {
  if (req.user.role !== 'doctor') {
    return {
      statusCode: 403,
      message: 'Only doctors can create availability',
    };
  }

  const doctor = await this.doctorsService.getDoctorProfile(req.user.user_id);
  return this.doctorsService.createAvailability(doctor.doctor_id, body);
}

// Get own availability
@Get('availability')
@UseGuards(AuthGuard('jwt'))
async getMyAvailability(@Request() req) {
  const doctor = await this.doctorsService.getDoctorProfile(req.user.user_id);
  return this.doctorsService.getDoctorAvailability(doctor.doctor_id);
}

// Update availability
@Put('availability/:id')
@UseGuards(AuthGuard('jwt'))
async updateAvailability(
  @Request() req,
  @Param('id', ParseIntPipe) availabilityId: number,
  @Body() body: any
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

// Get slots by date (for doctor to preview)
@Get('availability/slots/:date')
@UseGuards(AuthGuard('jwt'))
async getSlotsByDate(
  @Request() req,
  @Param('date') date: string,
) {
  const doctor = await this.doctorsService.getDoctorProfile(req.user.user_id);
  return this.doctorsService.getSlotsByDate(doctor.doctor_id, date);
}






// Search doctors by specialization (PUBLIC)
@Get('search')
async searchDoctors(@Query('specialization') specialization: string) {
  if (!specialization) {
    throw new BadRequestException('Specialization query parameter is required');
  }
  return this.doctorsService.searchDoctorsBySpecialization(specialization);
}

// Get all specializations (PUBLIC)
@Get('specializations')
async getAllSpecializations() {
  return this.doctorsService.getAllSpecializations();
}

// PUBLIC API: Get doctor slots by date (for patients)
@Get(':doctorId/slots/:date')
async getDoctorSlotsByDate(
  @Param('doctorId', ParseIntPipe) doctorId: number,
  @Param('date') date: string,
) {
  return this.doctorsService.getSlotsByDate(doctorId, date);
}


}