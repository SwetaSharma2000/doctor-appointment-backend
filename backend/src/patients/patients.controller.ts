import { 
  Controller, 
  Get, 
  Put, 
  Body, 
  UseGuards, 
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PatientsService } from './patients.service';

@Controller('patients')
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  // Get own patient profile
  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getMyProfile(@Request() req) {
    return this.patientsService.getPatientProfile(req.user.user_id);
  }

  // Update own patient profile
  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateMyProfile(
    @Request() req,
    @Body() body: {
      age?: number;
      gender?: string;
      weight?: number;
    }
  ) {
    // Check if user is actually a patient
    if (req.user.role !== 'patient') {
      return { 
        statusCode: 403,
        message: 'Only patients can update patient profile' 
      };
    }

    return this.patientsService.updatePatientProfile(req.user.user_id, body);
  }

  // Get all patients (for admin/doctor)
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getAllPatients() {
    return this.patientsService.getAllPatients();
  }
}