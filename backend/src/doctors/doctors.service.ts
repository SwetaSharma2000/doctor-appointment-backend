import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../entities/doctor.entity';
import { DoctorAvailability } from '../entities/doctor-availability.entity';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(DoctorAvailability)
    private availabilityRepository: Repository<DoctorAvailability>,
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






  // Create availability
async createAvailability(doctorId: number, availabilityData: {
  days_of_week: string[];
  start_time: string;
  end_time: string;
  duration_minutes: number;
  capacity: number;
  schedule_type: string;
}) {
  const availability = this.availabilityRepository.create({
    doctor_id: doctorId,
    ...availabilityData,
  });

  await this.availabilityRepository.save(availability);

  return {
    message: 'Availability created successfully',
    availability,
  };
}

// Get doctor's own availability
async getDoctorAvailability(doctorId: number) {
  return this.availabilityRepository.find({
    where: { doctor_id: doctorId, is_active: true },
  });
}

// Update availability
async updateAvailability(availabilityId: number, updateData: {
  days_of_week?: string[];
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  capacity?: number;
  schedule_type?: string;
}) {
  const availability = await this.availabilityRepository.findOne({
    where: { availability_id: availabilityId },
  });

  if (!availability) {
    throw new NotFoundException('Availability not found');
  }

  Object.assign(availability, updateData);
  await this.availabilityRepository.save(availability);

  return {
    message: 'Availability updated successfully',
    availability,
  };
}

// Delete availability
async deleteAvailability(availabilityId: number) {
  const availability = await this.availabilityRepository.findOne({
    where: { availability_id: availabilityId },
  });

  if (!availability) {
    throw new NotFoundException('Availability not found');
  }

  availability.is_active = false;
  await this.availabilityRepository.save(availability);

  return {
    message: 'Availability deleted successfully',
  };
}
}