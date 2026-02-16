import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Query,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('google')
  async googleTokenLogin(
    @Body() body: { token: string; role?: 'patient' | 'doctor' }
  ) {
    if (!body.token) {
      throw new BadRequestException('Token is required');
    }
    return this.authService.googleLogin(body.token, body.role);
  }

  @Post('test-login')
  async testLogin(
    @Body() body: { email: string; name: string; role?: 'patient' | 'doctor'; phone?: string }
  ) {
    if (!body.email || !body.name) {
      throw new BadRequestException('Email and name are required');
    }
    return this.authService.testLogin(body.email, body.name, body.role, body.phone);
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

  @Get('test-jwt')
  @UseGuards(AuthGuard('jwt'))
  testJwt(@Request() req) {
    return { message: 'JWT works!', user: req.user };
  }

  @Get('google')
  async googleAuth(@Query('role') role: string, @Res() res: Response) {
    const state = Buffer.from(JSON.stringify({ role: role || 'patient' })).toString('base64');
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}` +
      `&redirect_uri=http://localhost:3000/auth/google/callback` +
      `&response_type=code` +
      `&scope=email profile` +
      `&prompt=select_account` +
      `&state=${state}`;
    
    return res.redirect(googleAuthUrl);
  }

  @Get('google/callback')
  async googleAuthCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
    const role = decodedState.role || 'patient';

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: 'http://localhost:3000/auth/google/callback',
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userInfoResponse.json();

    const user = {
      google_id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      profile_picture: googleUser.picture,
      role,
    };

    const result = await this.authService.googleOAuthLogin(user);

    return res.json(result);
  }
}  