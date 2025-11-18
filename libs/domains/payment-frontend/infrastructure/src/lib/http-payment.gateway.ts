import { Result, ok, err } from 'neverthrow';
import {
  PaymentIntent,
  IPaymentGateway,
  PaymentRequestData,
} from '@going-monorepo-clean/domains-payment-frontend-core'; // Reemplaza con tu scope

// Esta es la URL de tu API Gateway (la pondrías en un .env de frontend)
const API_GATEWAY_URL = 'http://localhost:3000/api';

/**
 * Esta es la implementación "Adaptador" del puerto IPaymentGateway.
 * Sabe cómo hablar con el API Gateway (HTTP).
 */
export class HttpPaymentGateway implements IPaymentGateway {
  
  public async requestIntent(data: PaymentRequestData, token: string): Promise<Result<PaymentIntent, Error>> {
    try {
      // 1. Convierte los VOs a primitivos para el JSON
      const body = {
        userId: data.userId,
        referenceId: data.referenceId,
        amount: data.amount.toPrimitives(), // { amount: number, currency: string }
      };

      // 2. Llama al endpoint /api/payments/intent de tu Gateway
      const response = await fetch(`${API_GATEWAY_URL}/payments/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // <-- Adjunta el token
        },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return err(new Error(responseData.message || 'Error al solicitar el intento de pago'));
      }

      // La respuesta del backend debe tener { id, clientSecret, amount, referenceId }
      const paymentIntent = PaymentIntent.fromPrimitives({
          ...responseData,
          amount: data.amount.toPrimitives(), // Nos aseguramos de que el VO Money se reconstruya
          referenceId: data.referenceId,
      });
      
      return ok(paymentIntent);
      
    } catch (error) {
      return err(new Error(error.message || 'Error de red al solicitar el pago'));
    }
  }
}