import { Injectable, NotFoundException, ForbiddenException,BadRequestException } from '@nestjs/common';
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
  availability_type: 'recurring' | 'custom';
  days_of_week?: string[];
  specific_date?: string;
  timeOfDay?: string;
  start_time: string;
  end_time: string;
  scheduling_type: 'wave' | 'stream';
  duration_minutes?: number;
  capacity: number;
}) {
  // Validation
  if (availabilityData.availability_type === 'recurring' && !availabilityData.days_of_week) {
    throw new BadRequestException('days_of_week required for recurring availability');
  }

  if (availabilityData.availability_type === 'custom' && !availabilityData.specific_date) {
    throw new BadRequestException('specific_date required for custom availability');
  }


  // NEW: Check if custom date is in the past
if (availabilityData.availability_type === 'custom') {
  const specificDate = new Date(availabilityData.specific_date!);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (specificDate < today) {
    throw new BadRequestException('Cannot create availability for past dates');
  }
}

  if (availabilityData.scheduling_type === 'wave' && !availabilityData.duration_minutes) {
    throw new BadRequestException('duration_minutes required for wave scheduling');
  }

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
    order: { created_at: 'DESC' },
  });
}

// Update availability
async updateAvailability(availabilityId: number, updateData: any) {
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

// Delete availability (soft delete)
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

// Get availability for specific date (checks custom first, then recurring)
async getAvailabilityForDate(doctorId: number, date: string) {
  const dateObj = new Date(date);
  const dayOfWeek = dateObj
  .toLocaleDateString('en-US', { weekday: 'long' })
  .toLowerCase();
  // Check for custom availability first (overrides recurring)
  const customAvailability = await this.availabilityRepository.find({
    where: {
      doctor_id: doctorId,
      availability_type: 'custom',
      specific_date: dateObj as any,
      is_active: true,
    },
  });

  if (customAvailability.length > 0) {
    return customAvailability;
  }

  // No custom, check recurring - FIX: Use find instead of query builder
  const allRecurring = await this.availabilityRepository.find({
    where: {
      doctor_id: doctorId,
      availability_type: 'recurring',
      is_active: true,
    },
  });

  // Filter in JavaScript instead of SQL
  const recurringAvailability = allRecurring.filter(availability => 
    availability.days_of_week && availability.days_of_week.includes(dayOfWeek)
  );

  return recurringAvailability;
}

// Calculate slots for specific date
async getSlotsByDate(doctorId: number, date: string) {
  const availabilities = await this.getAvailabilityForDate(doctorId, date);

  if (availabilities.length === 0) {
    return {
      date,
      message: 'No availability for this date',
      slots: [],
    };
  }

  const allSlots: any[] = [];

  for (const availability of availabilities) {
    if (availability.scheduling_type === 'stream') {
      // Stream: Single slot with total capacity
      allSlots.push({
        availability_id: availability.availability_id,
        type: 'stream',
        start_time: availability.start_time,
        end_time: availability.end_time,
        capacity: availability.capacity,
        timeOfDay: availability.timeOfDay,
      });
    } else if (availability.scheduling_type === 'wave') {
      // Wave: Generate sub-slots
      const slots = this.generateWaveSlots(
        availability.start_time,
        availability.end_time,
        availability.duration_minutes!,
        availability.capacity,
        availability.availability_id,
        availability.timeOfDay,
      );
      allSlots.push(...slots);
    }
  }

  return {
    date,
    slots: allSlots,
  };
}

// Helper: Generate wave sub-slots
private generateWaveSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
  capacity: number,
  availabilityId: number,
  timeOfDay: string | null,
) {
  const slots: any[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let currentMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const slotStartHour = Math.floor(currentMinutes / 60);
    const slotStartMin = currentMinutes % 60;
    const slotEndMinutes = currentMinutes + durationMinutes;
    const slotEndHour = Math.floor(slotEndMinutes / 60);
    const slotEndMin = slotEndMinutes % 60;

    slots.push({
      availability_id: availabilityId,
      type: 'wave',
      start_time: `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}`,
      end_time: `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}`,
      capacity: capacity,
      timeOfDay: timeOfDay,
    });

    currentMinutes += durationMinutes;
  }

  return slots;
}



// Search doctors by specialization
async searchDoctorsBySpecialization(specialization: string) {
  const doctors = await this.doctorRepository.find({
    where: {
      specialization: specialization,
      is_verified: true,
      is_available: true,
    },
    select: [
      'doctor_id',
      'name',
      'specialization',
      'experience_years',
      'is_verified',
      'is_available',
    ],
  });

  return {
    specialization,
    count: doctors.length,
    doctors,
  };
}

// Get all unique specializations
async getAllSpecializations() {
  const doctors = await this.doctorRepository.find({
    where: { is_verified: true },
    select: ['specialization'],
  });

  const specializations = [...new Set(doctors.map(d => d.specialization).filter(Boolean))];

  return {
    specializations,
  };
}
}