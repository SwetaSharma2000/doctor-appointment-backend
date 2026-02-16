import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../entities/user.entity';
import { Doctor } from '../entities/doctor.entity';
import { Patient } from '../entities/patient.entity';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
     @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    private jwtService: JwtService,
  ) {
    console.log('JWT_SECRET in auth service:', process.env.JWT_SECRET);

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
        phone: phone || null,
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

 async googleOAuthLogin(googleUser: any) {
  const { email, name, google_id, profile_picture, role } = googleUser;

  let user = await this.userRepository.findOne({ 
    where: { email } 
  });

  if (user) {
    // EXISTING USER - Update role if different
    if (user.role !== role) {
      console.log(`Updating role for ${email} from ${user.role} to ${role}`);
      user.role = role;
      await this.userRepository.save(user);
    }
  } else {
    // NEW USER - create account
    console.log('Creating new user:', email, 'with role:', role);
    
    user = this.userRepository.create({
      email,
      name,
      google_id,
      role,
      profile_picture,
    });
    
    await this.userRepository.save(user);

    // IF DOCTOR - Create doctor record
    if (role === 'doctor') {
      const doctor = this.doctorRepository.create({
        user_id: user.user_id,
        name: user.name,
        specialization: null,
        experience_years: 0,
        is_verified: false,
        verification_status: 'pending',
        is_available: false,
      });
      
      await this.doctorRepository.save(doctor);
      console.log('Doctor record created for:', email);
    }

    // IF PATIENT - Create patient record
   if (role === 'patient') {
  const patient = this.patientRepository.create({
    user_id: user.user_id,
    name: user.name,
    age: null,
    gender: null,
    weight: null,
    relation: 'self',
  });
  
  await this.patientRepository.save(patient);
  console.log('Patient record created for:', email);
}
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
}
}  // ← Added this closing brace