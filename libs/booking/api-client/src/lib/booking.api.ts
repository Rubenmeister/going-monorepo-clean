import { Result, ok, err } from 'neverthrow';
import { UUID, Money } from '@going-monorepo-clean/shared-domain';

// --- El DTO de Reserva que viene del Backend (sin lógica de dominio) ---
export interface BookingDto {
    id: UUID;
    userId: UUID;
    serviceId: UUID;
    serviceType: 'transport' | 'accommodation' | 'tour' | 'experience';
    totalPrice: { amount: number; currency: string };
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    startDate: Date;
    endDate?: Date;
}

export interface CreateBookingRequest {
    userId: UUID;
    serviceId: UUID;
    serviceType: 'transport' | 'accommodation' | 'tour' | 'experience';
    totalPrice: { amount: number; currency: string };
    startDate: Date;
    endDate?: Date;
}

/**
 * Cliente HTTP puro para el dominio Booking.
 * Este es el Adaptador intermedio.
 */
export class BookingApiClient {
    private readonly baseUrl = 'http://localhost:3000/api/bookings';
    
    public async create(data: CreateBookingRequest, token: string): Promise<Result<BookingDto, Error>> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });
            
            const responseData: BookingDto = await response.json();
            
            if (!response.ok) {
                return err(new Error(responseData.message || 'Error al crear la reserva.'));
            }
            
            return ok(responseData);
        } catch (error) {
            return err(new Error('Error de red al crear la reserva.'));
        }
    }

    public async getByUser(userId: UUID, token: string): Promise<Result<BookingDto[], Error>> {
        // Lógica para obtener reservas de un usuario
        // ...
    }
}