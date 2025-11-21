import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

// --- El DTO de Intento de Pago que viene del Backend ---
export interface PaymentIntentDto {
    id: string; // El ID del Payment Intent de Stripe
    clientSecret: string; // La clave secreta para el SDK de Stripe
    amount: { amount: number; currency: string };
    referenceId: UUID; 
}

export interface PaymentRequestData {
    userId: UUID;
    referenceId: UUID;
    amount: { amount: number; currency: string };
}

/**
 * Cliente HTTP puro para el dominio Payment.
 * Este es el Adaptador intermedio.
 */
export class PaymentApiClient {
    private readonly baseUrl = 'http://localhost:3000/api/payments';
    
    public async requestIntent(data: PaymentRequestData, token: string): Promise<Result<PaymentIntentDto, Error>> {
        try {
            const response = await fetch(`${this.baseUrl}/intent`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });
            
            const responseData: PaymentIntentDto = await response.json();
            
            if (!response.ok) {
                return err(new Error(responseData.message || 'Error al solicitar el intento de pago.'));
            }
            
            return ok(responseData);
        } catch (error) {
            return err(new Error('Error de red al conectar con el Gateway.'));
        }
    }
}