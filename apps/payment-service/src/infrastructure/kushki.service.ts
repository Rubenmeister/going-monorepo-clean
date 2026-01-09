import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Result, ok, err } from 'neverthrow';

@Injectable()
export class KushkiService {
  private readonly logger = new Logger(KushkiService.name);
  private readonly merchantId: string;
  private readonly baseUrl: string = 'https://api.kushkipagos.com'; // or sandbox url

  constructor(private readonly configService: ConfigService) {
    this.merchantId = this.configService.get<string>('KUSHKI_PRIVATE_MERCHANT_ID');
  }

  /*
   * Charges a token (cajita/card token)
   */
  async charge(payload: {
    token: string;
    amount: number;
    currency: string;
    metadata?: any;
  }): Promise<Result<{ transactionId: string; status: string }, Error>> {
    try {
      if (!this.merchantId) {
        return err(new Error('KUSHKI_PRIVATE_MERCHANT_ID is not configured'));
      }

      // Example Kushki v1 Charge Endpoint (Simplified)
      // POST /card/v1/charges
      // Headers: Private-Merchant-Id
      const response = await axios.post(
        `${this.baseUrl}/card/v1/charges`,
        {
          token: payload.token,
          amount: {
            subtotalIva: 0,
            subtotalIva0: payload.amount,
            ice: 0,
            iva: 0,
            currency: payload.currency,
          },
          metadata: payload.metadata,
          fullResponse: true, 
        },
        {
          headers: {
            'Private-Merchant-Id': this.merchantId,
          },
        }
      );

      if (response.data.ticketNumber) {
        return ok({
          transactionId: response.data.ticketNumber,
          status: 'succeeded',
        });
      }

      return err(new Error('Payment failed: No ticket number returned'));
    } catch (error) {
      this.logger.error('Kushki charge failed', error.response?.data || error.message);
      return err(new Error(`Kushki Error: ${error.response?.data?.message || error.message}`));
    }
  }

  /*
   * Verify Webhook Signature (Placeholder - logic depends on Kushki specific webhook docs)
   */
  verifyWebhookSignature(headers: any, rawBody: Buffer): boolean {
    // Implement signature verification here provided by Kushki
    // For now returning true to allow flow
    return true; 
  }
}
