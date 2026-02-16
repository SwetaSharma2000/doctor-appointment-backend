import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../entities/doctor.entity';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
  ) {}

  // Get doctor profile by user_id
  async getDoctorProfile(userId: number) {
    const doctor = await this.doctorRepository.findOne({
      where: { user_id: userId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    return doctor;
  }

  // Update doctor profile (by doctor themselves)
  async updateDoctorProfile(userId: number, updateData: {
    specialization?: string;
    experience_years?: number;
  }) {
    const doctor = await this.doctorRepository.findOne({
      where: { user_id: userId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    // Update fields
    if (updateData.specialization) {
      doctor.specialization = updateData.specialization;
    }
    if (updateData.experience_years !== undefined) {
      doctor.experience_years = updateData.experience_years;
    }

    await this.doctorRepository.save(doctor);

    return {
      message: 'Profile updated successfully',
      doctor,
    };
  }

  // Admin: Verify doctor
  async verifyDoctor(doctorId: number, status: 'active' | 'rejected') {
    const doctor = await this.doctorRepository.findOne({
      where: { doctor_id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    doctor.verification_status = status;
    doctor.is_verified = status === 'active';
    doctor.is_available = status === 'active';

    await this.doctorRepository.save(doctor);

    return {
      message: `Doctor ${status === 'active' ? 'verified' : 'rejected'} successfully`,
      doctor,
    };
  }

  // Get all doctors (for admin)
  async getAllDoctors() {
    return this.doctorRepository.find();
  }
}