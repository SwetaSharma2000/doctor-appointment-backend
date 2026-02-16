import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  // Get patient profile by user_id


   async getPatientProfile(userId: number) {
    const patient = await this.patientRepository.findOne({
      where: { user_id: userId },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    return patient;
  }


  // update patient profile
  async updatePatientProfile(userId: number, updateData: {
  age?: number;
  gender?: string;
  weight?: number;
}) {
  const patient = await this.patientRepository.findOne({
    where: { user_id: userId },
  });

  if (!patient) {
    throw new NotFoundException('Patient profile not found');
  }

  // Update fields
  if (updateData.age !== undefined) {
    patient.age = updateData.age;
  }
  if (updateData.gender) {
    patient.gender = updateData.gender;
  }
  if (updateData.weight !== undefined) {
    patient.weight = updateData.weight;
  }

  // Mark profile as completed if all required fields are filled
  if (patient.age && patient.gender && patient.weight) {
    patient.is_profile_completed = true;
  }

  await this.patientRepository.save(patient);

  return {
    message: 'Profile updated successfully',
    patient,
  };
}
  
  // Get all patients (for admin/doctor)
  async getAllPatients() {
    return this.patientRepository.find();
  }
}