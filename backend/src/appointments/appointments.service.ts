import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { DoctorAvailability } from '../entities/doctor-availability.entity';
import { Patient } from '../entities/patient.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(DoctorAvailability)
    private availabilityRepository: Repository<DoctorAvailability>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  // Generate token number
  private generateTokenNumber(doctorId: number, date: string): string {
    const dateStr = date.replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DOC-${doctorId}-${dateStr}-${random}`;
  }

  // Check slot availability
  private async checkSlotAvailability(
    availabilityId: number,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<{ available: boolean; capacity: number; booked: number }> {
    const availability = await this.availabilityRepository.findOne({
      where: { availability_id: availabilityId },
    });

    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    // Count existing appointments for this slot
    const bookedCount = await this.appointmentRepository.count({
      where: {
        availability_id: availabilityId,
        appointment_date: new Date(date) as any,
        slot_start_time: startTime,
        slot_end_time: endTime,
        status: 'waiting',
      },
    });

    const isAvailable = bookedCount < availability.capacity;

    return {
      available: isAvailable,
      capacity: availability.capacity,
      booked: bookedCount,
    };
  }

  // Book appointment
  async bookAppointment(userId: number, bookingData: {
  doctor_id: number;
  availability_id: number;
  appointment_date: string;
  slot_start_time: string;
  slot_end_time: string;
  patient_name: string;
  patient_relation: string;
  complaint?: string;
  visit_type: string;
}) {
  // Get patient_id from user_id
  const patient = await this.patientRepository.findOne({
    where: { user_id: userId },
  });

  if (!patient) {
    throw new NotFoundException('Patient profile not found');
  }

  // Check if slot is available
  const slotCheck = await this.checkSlotAvailability(
    bookingData.availability_id,
    bookingData.appointment_date,
    bookingData.slot_start_time,
    bookingData.slot_end_time,
  );

  if (!slotCheck.available) {
    throw new BadRequestException(
      `Slot is fully booked (${slotCheck.booked}/${slotCheck.capacity} patients)`,
    );
  }

  // Generate token
  const tokenNumber = this.generateTokenNumber(
    bookingData.doctor_id,
    bookingData.appointment_date,
  );

  // Create appointment
  const appointment = this.appointmentRepository.create({
    patient_id: patient.patient_id,  // ← Use patient.patient_id, not userId
    ...bookingData,
    token_number: tokenNumber,
    status: 'waiting',
  });

  await this.appointmentRepository.save(appointment);

  return {
    message: 'Appointment booked successfully',
    appointment: {
      ...appointment,
      slots_remaining: slotCheck.capacity - slotCheck.booked - 1,
    },
  };
}

  // Get patient's appointments
  async getPatientAppointments(userId: number) {
    
  const patient = await this.patientRepository.findOne({
    where: { user_id: userId },
  });

  if (!patient) {
    throw new NotFoundException('Patient profile not found');
  }

  return this.appointmentRepository.find({
    where: { patient_id: patient.patient_id },  // ← Use patient.patient_id
    order: { appointment_date: 'DESC', slot_start_time: 'DESC' },
  });
  }

  // Get doctor's appointments
  async getDoctorAppointments(doctorId: number, date?: string) {
    const where: any = { doctor_id: doctorId };

    if (date) {
      where.appointment_date = new Date(date);
    }

    return this.appointmentRepository.find({
      where,
      order: { appointment_date: 'ASC', slot_start_time: 'ASC' },
    });
  }

  // Cancel appointment
  async cancelAppointment(userId: number, userRole: string, appointmentId: number) {
  const appointment = await this.appointmentRepository.findOne({
    where: { appointment_id: appointmentId },
  });

  if (!appointment) {
    throw new NotFoundException('Appointment not found');
  }

  // Check authorization for patient
  if (userRole === 'patient') {
    // Get patient_id from user_id
    const patient = await this.patientRepository.findOne({
      where: { user_id: userId },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    if (appointment.patient_id !== patient.patient_id) {
      throw new BadRequestException('Not authorized to cancel this appointment');
    }
  }

  appointment.status = 'cancelled';
  await this.appointmentRepository.save(appointment);

  return {
    message: 'Appointment cancelled successfully',
    appointment,
  };
}

   

  // Update appointment status (doctor only)
  async updateAppointmentStatus(appointmentId: number, status: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: { appointment_id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    appointment.status = status;
    await this.appointmentRepository.save(appointment);

    return {
      message: 'Appointment status updated',
      appointment,
    };
  }
}