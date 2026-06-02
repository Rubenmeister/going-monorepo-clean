import { TaxCalculatorService } from './tax-calculator.service';

describe('TaxCalculatorService', () => {
  let service: TaxCalculatorService;

  beforeEach(() => {
    service = new TaxCalculatorService();
  });

  describe('getTaxRate', () => {
    it('devuelve la tasa de un país conocido', () => {
      const rate = service.getTaxRate('ES');
      expect(rate.taxName).toBe('IVA');
      expect(rate.standardRate).toBe(21);
    });

    it('es insensible a mayúsculas/minúsculas', () => {
      expect(service.getTaxRate('de').standardRate).toBe(19);
    });

    it('cae a la tasa EU por defecto si el país es desconocido', () => {
      const rate = service.getTaxRate('XX');
      expect(rate.country).toBe('European Union');
      expect(rate.standardRate).toBe(20);
    });
  });

  describe('calculateTax', () => {
    it('calcula el impuesto sobre una base en céntimos', () => {
      // 10000 céntimos al 21% = 2100
      expect(service.calculateTax(10000, 21)).toBe(2100);
    });

    it('redondea al céntimo más cercano', () => {
      // 10033 * 21% = 2106.93 → 2107
      expect(service.calculateTax(10033, 21)).toBe(2107);
    });

    it('devuelve 0 cuando la tasa es 0', () => {
      expect(service.calculateTax(10000, 0)).toBe(0);
    });

    it('devuelve 0 cuando la base es 0', () => {
      expect(service.calculateTax(0, 21)).toBe(0);
    });

    it('lanza error con base negativa', () => {
      expect(() => service.calculateTax(-1, 21)).toThrow(
        'Base amount and tax rate must be non-negative'
      );
    });

    it('lanza error con tasa negativa', () => {
      expect(() => service.calculateTax(100, -5)).toThrow(
        'Base amount and tax rate must be non-negative'
      );
    });
  });

  describe('calculateWithTax', () => {
    it('devuelve base, impuesto y total coherentes', () => {
      const result = service.calculateWithTax(10000, 21);
      expect(result).toEqual({ base: 10000, tax: 2100, total: 12100 });
    });

    it('total = base cuando la tasa es 0', () => {
      expect(service.calculateWithTax(5000, 0)).toEqual({
        base: 5000,
        tax: 0,
        total: 5000,
      });
    });
  });

  describe('calculateFromTotal', () => {
    it('extrae la base de un total que ya incluye impuesto', () => {
      // total 12100 con 21% → base 10000, tax 2100
      const result = service.calculateFromTotal(12100, 21);
      expect(result.base).toBe(10000);
      expect(result.tax).toBe(2100);
      expect(result.total).toBe(12100);
    });

    it('base + tax siempre reconstruyen el total (sin pérdida por redondeo)', () => {
      const result = service.calculateFromTotal(9999, 21);
      expect(result.base + result.tax).toBe(9999);
    });
  });

  describe('isB2BVatExempt', () => {
    it('exime una venta intracomunitaria B2B con VAT ID válido', () => {
      // vendedor ES, comprador FR, VAT ID FR válido
      expect(service.isB2BVatExempt('ES', 'FR', 'FR12345678901')).toBe(true);
    });

    it('NO exime una venta doméstica (mismo país)', () => {
      expect(service.isB2BVatExempt('ES', 'ES', 'A12345678B')).toBe(false);
    });

    it('NO exime si falta el VAT ID', () => {
      expect(service.isB2BVatExempt('ES', 'FR')).toBe(false);
    });

    it('NO exime si alguno de los países está fuera de la UE', () => {
      expect(service.isB2BVatExempt('US', 'FR', 'FR12345678901')).toBe(false);
      expect(service.isB2BVatExempt('ES', 'US', 'US123456789')).toBe(false);
    });

    it('NO exime si el VAT ID tiene formato inválido para el país', () => {
      expect(service.isB2BVatExempt('ES', 'FR', 'INVALIDO')).toBe(false);
    });
  });

  describe('isValidVatId', () => {
    it('valida el formato español (A12345678B)', () => {
      expect(service.isValidVatId('A12345678B', 'ES')).toBe(true);
      expect(service.isValidVatId('12345678', 'ES')).toBe(false);
    });

    it('valida el formato francés (FR + 11 dígitos)', () => {
      expect(service.isValidVatId('FR12345678901', 'FR')).toBe(true);
      expect(service.isValidVatId('FR123', 'FR')).toBe(false);
    });

    it('usa un patrón EU genérico para países sin patrón específico', () => {
      expect(service.isValidVatId('NL123456789B01', 'NL')).toBe(true);
      expect(service.isValidVatId('X1', 'NL')).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('formatea céntimos a moneda', () => {
      // 10000 céntimos = 100.00
      const out = service.formatCurrency(10000, 'EUR', 'en-US');
      expect(out).toContain('100.00');
    });

    it('usa EUR y en-US por defecto', () => {
      expect(service.formatCurrency(2550)).toContain('25.50');
    });

    it('no lanza con un código de moneda inválido (fallback)', () => {
      const out = service.formatCurrency(10000, 'INVALID');
      expect(out).toContain('100.00');
    });
  });

  describe('calculateTaxSummary', () => {
    it('agrupa el impuesto por tasa', () => {
      const summary = service.calculateTaxSummary([
        { quantity: 2, unitPrice: 1000, taxRate: 21 }, // 2000 * 21% = 420
        { quantity: 1, unitPrice: 5000, taxRate: 21 }, // 5000 * 21% = 1050
        { quantity: 3, unitPrice: 1000, taxRate: 10 }, // 3000 * 10% = 300
      ]);

      const rate21 = summary.find((s) => s.rate === 21);
      const rate10 = summary.find((s) => s.rate === 10);

      expect(rate21?.amount).toBe(1470); // 420 + 1050
      expect(rate10?.amount).toBe(300);
      expect(rate21?.description).toBe('21% Tax');
    });

    it('devuelve lista vacía sin line items', () => {
      expect(service.calculateTaxSummary([])).toEqual([]);
    });
  });
});
