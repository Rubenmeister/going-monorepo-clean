/// <reference types="cypress" />

describe('Payment Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.login('test@example.com', 'Password123!');
  });

  it('should complete payment for booking', () => {
    // Navigate to bookings
    cy.visit('http://localhost:3000/dashboard');
    cy.contains('Reservas').click();
    cy.contains('Nueva Reserva').click();

    // Create booking
    cy.get('input[placeholder="Ubicación de inicio"]').type('123 Main St');
    cy.get('input[placeholder="Ubicación de destino"]').type('456 Oak Ave');
    cy.get('button').contains('Continuar').click();

    // Select vehicle
    cy.get('[data-cy=select-vehicle]').first().click();
    cy.get('button').contains('Seleccionar').click();

    // Proceed to payment
    cy.get('button').contains('Ir a Pago').click();
    cy.url().should('include', '/payment');

    // Enter card details
    cy.get('input[placeholder="Número de tarjeta"]').type('4111111111111111');
    cy.get('input[placeholder="MM/AA"]').type('12/25');
    cy.get('input[placeholder="CVV"]').type('123');
    cy.get('input[placeholder="Nombre del titular"]').type('Test User');

    // Submit payment
    cy.get('button').contains('Pagar ahora').click();

    // Verify payment success
    cy.contains('Pago realizado exitosamente').should('be.visible');
    cy.url().should('include', '/booking-confirmation');

    // Verify booking status updated
    cy.visit('http://localhost:3000/dashboard/bookings');
    cy.contains('Pagado').should('be.visible');
  });

  it('should handle payment failure with invalid card', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.contains('Reservas').click();
    cy.contains('Nueva Reserva').click();

    // Create booking
    cy.get('input[placeholder="Ubicación de inicio"]').type('123 Main St');
    cy.get('input[placeholder="Ubicación de destino"]').type('456 Oak Ave');
    cy.get('button').contains('Continuar').click();

    // Select vehicle
    cy.get('[data-cy=select-vehicle]').first().click();
    cy.get('button').contains('Seleccionar').click();

    // Proceed to payment
    cy.get('button').contains('Ir a Pago').click();

    // Enter invalid card
    cy.get('input[placeholder="Número de tarjeta"]').type('4000000000000002');
    cy.get('input[placeholder="MM/AA"]').type('12/25');
    cy.get('input[placeholder="CVV"]').type('123');
    cy.get('input[placeholder="Nombre del titular"]').type('Test User');

    // Submit payment
    cy.get('button').contains('Pagar ahora').click();

    // Verify error message
    cy.contains('Error en el pago').should('be.visible');
    cy.contains('Tarjeta rechazada').should('be.visible');

    // Verify retry button available
    cy.get('button').contains('Reintentar').should('be.visible');
  });

  it('should support multiple payment methods', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.contains('Reservas').click();
    cy.contains('Nueva Reserva').click();

    // Create booking
    cy.get('input[placeholder="Ubicación de inicio"]').type('123 Main St');
    cy.get('input[placeholder="Ubicación de destino"]').type('456 Oak Ave');
    cy.get('button').contains('Continuar').click();

    // Select vehicle
    cy.get('[data-cy=select-vehicle]').first().click();
    cy.get('button').contains('Seleccionar').click();

    // Proceed to payment
    cy.get('button').contains('Ir a Pago').click();

    // Verify payment method options
    cy.get('[data-cy=payment-method-credit-card]').should('be.visible');
    cy.get('[data-cy=payment-method-debit-card]').should('be.visible');
    cy.get('[data-cy=payment-method-wallet]').should('be.visible');

    // Test switching between payment methods
    cy.get('[data-cy=payment-method-debit-card]').click();
    cy.get('input[placeholder="Número de tarjeta"]').should('be.visible');

    cy.get('[data-cy=payment-method-wallet]').click();
    cy.get('[data-cy=wallet-select]').should('be.visible');
  });

  it('should apply discount codes', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.contains('Reservas').click();
    cy.contains('Nueva Reserva').click();

    // Create booking
    cy.get('input[placeholder="Ubicación de inicio"]').type('123 Main St');
    cy.get('input[placeholder="Ubicación de destino"]').type('456 Oak Ave');
    cy.get('button').contains('Continuar').click();

    // Select vehicle
    cy.get('[data-cy=select-vehicle]').first().click();
    cy.get('button').contains('Seleccionar').click();

    // Get initial price
    cy.get('[data-cy=total-price]').then(($price) => {
      const initialPrice = parseFloat($price.text());

      // Proceed to payment
      cy.get('button').contains('Ir a Pago').click();

      // Apply discount code
      cy.get('input[placeholder="Código de descuento"]').type('SAVE10');
      cy.get('button').contains('Aplicar').click();

      // Verify discount applied
      cy.contains('Descuento aplicado').should('be.visible');
      cy.get('[data-cy=discount-amount]').should('contain', '-');

      // Verify final price is less
      cy.get('[data-cy=final-price]').then(($finalPrice) => {
        const finalPrice = parseFloat($finalPrice.text());
        expect(finalPrice).to.be.lessThan(initialPrice);
      });
    });
  });

  it('should save payment method for future use', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.contains('Reservas').click();
    cy.contains('Nueva Reserva').click();

    // Create booking
    cy.get('input[placeholder="Ubicación de inicio"]').type('123 Main St');
    cy.get('input[placeholder="Ubicación de destino"]').type('456 Oak Ave');
    cy.get('button').contains('Continuar').click();

    // Select vehicle
    cy.get('[data-cy=select-vehicle]').first().click();
    cy.get('button').contains('Seleccionar').click();

    // Proceed to payment
    cy.get('button').contains('Ir a Pago').click();

    // Enter card details
    cy.get('input[placeholder="Número de tarjeta"]').type('4111111111111111');
    cy.get('input[placeholder="MM/AA"]').type('12/25');
    cy.get('input[placeholder="CVV"]').type('123');
    cy.get('input[placeholder="Nombre del titular"]').type('Test User');

    // Check save payment method
    cy.get('input[type="checkbox"][data-cy="save-payment"]').check();

    // Submit payment
    cy.get('button').contains('Pagar ahora').click();

    // Verify success
    cy.contains('Pago realizado exitosamente').should('be.visible');

    // Verify saved payment method appears in future bookings
    cy.visit('http://localhost:3000/dashboard');
    cy.contains('Reservas').click();
    cy.contains('Nueva Reserva').click();

    cy.get('input[placeholder="Ubicación de inicio"]').type('789 Elm St');
    cy.get('input[placeholder="Ubicación de destino"]').type('321 Pine Ave');
    cy.get('button').contains('Continuar').click();

    cy.get('[data-cy=select-vehicle]').first().click();
    cy.get('button').contains('Seleccionar').click();

    cy.get('button').contains('Ir a Pago').click();

    // Verify saved card is available
    cy.get('[data-cy=saved-payment-methods]').should('be.visible');
    cy.contains('•••• 1111').should('be.visible');
  });
});
