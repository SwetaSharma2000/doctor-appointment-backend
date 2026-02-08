import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  UseGuards, 
  Request, 
  BadRequestException 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('google')
  async googleAuth(
    @Body() body: { token: string; role?: 'patient' | 'doctor' }
  ) {
    if (!body.token) {
      throw new BadRequestException('Token is required');
    }
    return this.authService.googleLogin(body.token, body.role);
  }

  @Post('test-login')
  async testLogin(
    @Body() body: { email: string; name: string; role?: 'patient' | 'doctor'; phone?: string }  // ← CHANGE 1
  ) {
    if (!body.email || !body.name) {
      throw new BadRequestException('Email and name are required');
    }
    return this.authService.testLogin(body.email, body.name, body.role, body.phone);  // ← CHANGE 2
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Request() req) {
    return {
      id: req.user.user_id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      phone: req.user.phone,
      profile_picture: req.user.profile_picture,
      created_at: req.user.created_at,
    };
  }
}