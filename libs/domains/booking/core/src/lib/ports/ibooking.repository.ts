import { Booking } from '../entities/booking.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

// Usamos Symbol para inyección de dependencias
export const I_BOOKING_REPOSITORY = Symbol('IBookingRepository');

export interface IBookingRepository {
  /**
   * Guarda una nueva reserva o actualiza una existente.
   * @param booking El objeto de dominio Booking.
   */
  save(booking: Booking): Promise<Booking>;

  /**
   * Busca una reserva por su ID.
   * @param id El ID de la reserva.
   */
  findById(id: UUID): Promise<Booking | null>;

  /**
   * Busca todas las reservas de un usuario específico.
   * @param userId El ID del usuario.
   */
  findByUserId(userId: UUID): Promise<Booking[]>;

  /**
   * Busca todas las reservas para una experiencia específica.
   * @param experienceId El ID de la experiencia.
   */
  findByExperienceId(experienceId: UUID): Promise<Booking[]>;
  
  // Podrías necesitar un método para buscar reservas por estado, si es común.
  // findByStatus(status: BookingStatus): Promise<Booking[]>; 
}