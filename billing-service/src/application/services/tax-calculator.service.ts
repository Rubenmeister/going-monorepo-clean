/**
 * Tax Calculator Service
 * Handles VAT/IVA calculations for different countries and tax rates
 */

import { Injectable, Logger } from '@nestjs/common';

export interface TaxRate {
  country: string;
  taxName: string; // VAT, IVA, GST, etc.
  standardRate: number;
  reducedRate?: number;
  superReducedRate?: number;
}

@Injectable()
export class TaxCalculatorService {
  private readonly logger = new Logger(TaxCalculatorService.name);

  // Common tax rates by country
  private readonly taxRates: Map<string, TaxRate> = new Map([
    [
      'ES',
      {
        country: 'Spain',
        taxName: 'IVA',
        standardRate: 21,
        reducedRate: 10,
        superReducedRate: 4,
      },
    ],
    [
      'EU',
      {
        country: 'European Union',
        taxName: 'VAT',
        standardRate: 20,
        reducedRate: 10,
      },
    ],
    [
      'US',
      {
        country: 'United States',
        taxName: 'Sales Tax',
        standardRate: 0, // Varies by state
      },
    ],
    [
      'UK',
      {
        country: 'United Kingdom',
        taxName: 'VAT',
        standardRate: 20,
        reducedRate: 5,
        superReducedRate: 0,
      },
    ],
    [
      'FR',
      {
        country: 'France',
        taxName: 'VAT',
        standardRate: 20,
        reducedRate: 5.5,
        superReducedRate: 2.1,
      },
    ],
    [
      'DE',
      {
        country: 'Germany',
        taxName: 'VAT',
        standardRate: 19,
        reducedRate: 7,
      },
    ],
    [
      'IT',
      {
        country: 'Italy',
        taxName: 'VAT',
        standardRate: 22,
        reducedRate: 10,
        superReducedRate: 5,
      },
    ],
  ]);

  /**
   * Get tax rate for a country
   * @param countryCode ISO country code (e.g., 'ES', 'US')
   * @returns Tax rate information
   */
  getTaxRate(countryCode: string): TaxRate {
    const code = countryCode.toUpperCase();
    const rate = this.taxRates.get(code);

    if (!rate) {
      this.logger.warn(`Unknown country code: ${code}, using default EU rate`);
      return this.taxRates.get('EU')!;
    }

    return rate;
  }

  /**
   * Calculate tax amount
   * @param baseAmount Base amount in cents
   * @param taxRate Tax rate as percentage (0-100)
   * @returns Tax amount in cents
   */
  calculateTax(baseAmount: number, taxRate: number): number {
    if (baseAmount < 0 || taxRate < 0) {
      throw new Error('Base amount and tax rate must be non-negative');
    }

    return Math.round((baseAmount * taxRate) / 100);
  }

  /**
   * Calculate total with tax
   * @param baseAmount Base amount in cents
   * @param taxRate Tax rate as percentage
   * @returns Object with base, tax, and total amounts
   */
  calculateWithTax(
    baseAmount: number,
    taxRate: number
  ): { base: number; tax: number; total: number } {
    const tax = this.calculateTax(baseAmount, taxRate);

    return {
      base: baseAmount,
      tax,
      total: baseAmount + tax,
    };
  }

  /**
   * Calculate tax backwards from total (includes tax)
   * @param totalAmount Total amount in cents (including tax)
   * @param taxRate Tax rate as percentage
   * @returns Object with base, tax, and total amounts
   */
  calculateFromTotal(
    totalAmount: number,
    taxRate: number
  ): { base: number; tax: number; total: number } {
    const divisor = (100 + taxRate) / 100;
    const base = Math.round(totalAmount / divisor);
    const tax = totalAmount - base;

    return {
      base,
      tax,
      total: totalAmount,
    };
  }

  /**
   * Check if business-to-business (B2B) transaction is eligible for VAT exemption
   * @param sellerCountry Seller's country code
   * @param buyerCountry Buyer's country code
   * @param buyerVatId Buyer's VAT ID
   * @returns True if eligible for VAT exemption
   */
  isB2BVatExempt(
    sellerCountry: string,
    buyerCountry: string,
    buyerVatId?: string
  ): boolean {
    // Within EU: B2B transactions with valid VAT ID are exempt
    const euCountries = [
      'AT',
      'BE',
      'BG',
      'HR',
      'CY',
      'CZ',
      'DK',
      'EE',
      'FI',
      'FR',
      'DE',
      'GR',
      'HU',
      'IE',
      'IT',
      'LV',
      'LT',
      'LU',
      'MT',
      'NL',
      'PL',
      'PT',
      'RO',
      'SK',
      'SI',
      'ES',
      'SE',
    ];

    const sellerInEu = euCountries.includes(sellerCountry.toUpperCase());
    const buyerInEu = euCountries.includes(buyerCountry.toUpperCase());

    if (!sellerInEu || !buyerInEu) {
      return false;
    }

    if (sellerCountry === buyerCountry) {
      return false; // Domestic transaction, not exempt
    }

    // Requires valid VAT ID
    return !!buyerVatId && this.isValidVatId(buyerVatId, buyerCountry);
  }

  /**
   * Validate VAT ID format
   * @param vatId VAT ID to validate
   * @param countryCode Country code
   * @returns True if VAT ID format is valid
   */
  isValidVatId(vatId: string, countryCode: string): boolean {
    const code = countryCode.toUpperCase();

    // Basic VAT ID format validation by country
    const vatPatterns: Map<string, RegExp> = new Map([
      ['ES', /^[A-Z]\d{8}[A-Z]$/], // Spain: A12345678B
      ['FR', /^[A-Z]{2}\d{11}$/], // France: FR12345678901
      ['DE', /^[A-Z]{2}\d{9,10}$/], // Germany: DE123456789
      ['IT', /^[A-Z]{2}\d{11}$/], // Italy: IT12345678901
      ['UK', /^[A-Z]{2}\d{9,12}$/], // UK: GB123456789
    ]);

    const pattern = vatPatterns.get(code);
    if (!pattern) {
      return /^[A-Z]{2}[A-Z0-9]{9,}$/.test(vatId); // Basic EU format
    }

    return pattern.test(vatId);
  }

  /**
   * Format currency amount for display
   * @param amountInCents Amount in cents
   * @param currencyCode Currency code (e.g., 'USD', 'EUR')
   * @param locale Locale for formatting (e.g., 'es-ES', 'en-US')
   * @returns Formatted string (e.g., '€100.00')
   */
  formatCurrency(
    amountInCents: number,
    currencyCode: string = 'EUR',
    locale: string = 'en-US'
  ): string {
    const amount = amountInCents / 100;

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      this.logger.warn(
        `Failed to format currency: ${error}, returning raw amount`
      );
      return `${amount.toFixed(2)} ${currencyCode}`;
    }
  }

  /**
   * Calculate tax summary for invoice
   * @param lineItems Line items with tax rates
   * @returns Tax breakdown by rate
   */
  calculateTaxSummary(
    lineItems: Array<{
      quantity: number;
      unitPrice: number;
      taxRate: number;
    }>
  ): Array<{ rate: number; amount: number; description: string }> {
    const taxByRate = new Map<number, number>();

    lineItems.forEach((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const tax = this.calculateTax(itemTotal, item.taxRate);
      const current = taxByRate.get(item.taxRate) || 0;
      taxByRate.set(item.taxRate, current + tax);
    });

    return Array.from(taxByRate.entries()).map(([rate, amount]) => ({
      rate,
      amount,
      description: `${rate}% Tax`,
    }));
  }
}
