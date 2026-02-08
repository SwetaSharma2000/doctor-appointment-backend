import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async googleLogin(idToken: string, role?: string) {
    try {
      // Verify Google token
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { sub: google_id, email, name, picture } = payload!;

      if (!email) {
        throw new BadRequestException('Email not provided by Google');
      }

      // Check if user exists
      let user = await this.userRepository.findOne({ 
        where: { email } 
      });

      if (user) {
        // EXISTING USER - LOGIN
        if (picture && user.profile_picture !== picture) {
          user.profile_picture = picture;
          await this.userRepository.save(user);
        }
      } else {
        // NEW USER - SIGNUP
        if (!role) {
          throw new BadRequestException('Role is required for new user registration');
        }

        if (role !== 'patient' && role !== 'doctor') {
          throw new BadRequestException('Role must be either "patient" or "doctor"');
        }

        user = this.userRepository.create({
          email,
          name,
          google_id: google_id,
          role,
          profile_picture: picture,
        });
        
        await this.userRepository.save(user);
      }

      // Generate JWT token
      const access_token = this.jwtService.sign({
        sub: user.user_id,
        email: user.email,
        role: user.role,
      });

      return {
        access_token,
        user: {
          id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile_picture: user.profile_picture,
        },
      };

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  // Test endpoint - for Postman testing without Google
  async testLogin(email: string, name: string, role?: string, phone?: string) {
    let user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      // Existing user - login
    } else {
      // New user - signup
      if (!role) {
        throw new BadRequestException('Role required for new users');
      }

      if (role !== 'patient' && role !== 'doctor') {
        throw new BadRequestException('Role must be either "patient" or "doctor"');
      }

      user = this.userRepository.create({
        email,
        name,
        google_id: 'test_' + Date.now(),
        role,
        phone: phone ?? null,
        profile_picture: 'https://via.placeholder.com/150',
      });
      
      await this.userRepository.save(user);
    }

    const access_token = this.jwtService.sign({
      sub: user.user_id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profile_picture: user.profile_picture,
      },
    };
  }

  async validateUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { user_id: userId } 
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}