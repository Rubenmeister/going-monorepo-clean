/// <reference types="cypress" />

describe('Complete End-to-End Workflow', () => {
  it('should complete full passenger booking to ride completion flow', () => {
    // Step 1: Register new user
    cy.visit('http://localhost:3000');
    cy.contains('¿No tienes cuenta?').click();

    cy.get('input[placeholder="Nombre"]').type('Maria');
    cy.get('input[placeholder="Apellido"]').type('García');
    cy.get('input[placeholder="Email"]').type(
      `passenger-${Date.now()}@example.com`
    );
    cy.get('input[placeholder="Contraseña"]').type('Password123!');
    cy.get('input[placeholder="Confirmar Contraseña"]').type('Password123!');

    cy.get('button').contains('Registrarse').click();
    cy.url().should('include', '/dashboard');

    // Step 2: Update profile
    cy.get('button').contains('Mi Perfil').click();
    cy.get('input[data-cy="profile-phone"]').type('+34 912 345 678');
    cy.get('input[data-cy="profile-address"]').type(
      'Calle Principal 123, Madrid'
    );
    cy.get('button').contains('Guardar Cambios').click();
    cy.contains('Perfil actualizado exitosamente').should('be.visible');

    // Step 3: Create booking
    cy.visit('http://localhost:3000/dashboard');
    cy.contains('Nueva Reserva').click();

    cy.get('input[placeholder="Ubicación de inicio"]').type(
      'Puerta del Sol, Madrid'
    );
    cy.get('input[placeholder="Ubicación de destino"]').type('Retiro, Madrid');
    cy.get('button').contains('Continuar').click();

    // Step 4: Select vehicle
    cy.get('[data-cy="select-vehicle"]').first().click();
    cy.get('button').contains('Seleccionar').click();

    // Step 5: Make payment
    cy.get('button').contains('Ir a Pago').click();
    cy.url().should('include', '/payment');

    cy.get('input[placeholder="Número de tarjeta"]').type('4111111111111111');
    cy.get('input[placeholder="MM/AA"]').type('12/25');
    cy.get('input[placeholder="CVV"]').type('123');
    cy.get('input[placeholder="Nombre del titular"]').type('Maria García');

    cy.get('input[data-cy="save-payment"]').check();
    cy.get('button').contains('Pagar ahora').click();

    // Step 6: Verify booking confirmation
    cy.contains('Pago realizado exitosamente').should('be.visible');
    cy.url().should('include', '/booking-confirmation');

    cy.get('[data-cy="booking-number"]').should('be.visible');
    const bookingNumber = cy
      .get('[data-cy="booking-number"]')
      .then(($el) => $el.text());

    // Step 7: Wait for driver acceptance
    cy.visit('http://localhost:3000/bookings');
    cy.contains('En proceso de búsqueda').should('be.visible');

    // Simulate driver accepting (in real scenario, another user would do this)
    cy.task('simulateDriverAcceptance', { bookingId: bookingNumber });

    // Step 8: Track ride
    cy.reload();
    cy.contains('Driver en camino').should('be.visible', { timeout: 10000 });

    cy.get('[data-cy="driver-info"]').should('be.visible');
    cy.get('[data-cy="driver-rating"]').should('be.visible');
    cy.get('[data-cy="live-tracking"]').should('be.visible');

    // Step 9: Simulate ride completion
    cy.task('simulateRideCompletion', { bookingId: bookingNumber });

    cy.reload();
    cy.contains('Viaje completado').should('be.visible', { timeout: 10000 });

    // Step 10: Rate driver
    cy.get('[data-cy="rating-section"]').should('be.visible');
    cy.get('[data-cy="star-5"]').click();
    cy.get('textarea[data-cy="rating-comment"]').type(
      'Excelente servicio, muy profesional'
    );
    cy.get('button').contains('Enviar Calificación').click();

    cy.contains('Calificación registrada exitosamente').should('be.visible');

    // Step 11: View ride history
    cy.visit('http://localhost:3000/dashboard');
    cy.contains('Mis Viajes').click();

    cy.contains('Completado').should('be.visible');
    cy.get('[data-cy="ride-item"]')
      .first()
      .within(() => {
        cy.contains('Puerta del Sol').should('be.visible');
        cy.contains('Retiro').should('be.visible');
      });

    // Step 12: Verify earnings tracking (if applicable)
    cy.visit('http://localhost:3000/profile/earnings');
    cy.contains('Total gastado en viajes').should('be.visible');
  });

  it('should complete driver acceptance to ride completion flow', () => {
    // Step 1: Login as driver
    cy.visit('http://localhost:3000/login');
    cy.get('input[placeholder="Email"]').type('driver@example.com');
    cy.get('input[placeholder="Contraseña"]').type('Password123!');
    cy.get('button').contains('Iniciar Sesión').click();

    cy.url().should('include', '/dashboard');

    // Step 2: Verify driver profile is complete
    cy.get('button').contains('Mi Perfil').click();
    cy.get('[data-cy="license-verification"]').should(
      'have.text',
      'Verificado'
    );
    cy.get('[data-cy="vehicle-verification"]').should(
      'have.text',
      'Verificado'
    );

    // Step 3: Go online
    cy.visit('http://localhost:3000/dashboard');
    cy.get('[data-cy="go-online-button"]').click();
    cy.contains('En línea').should('be.visible');

    // Step 4: Accept incoming ride request
    cy.get('[data-cy="incoming-ride-request"]', { timeout: 10000 }).should(
      'be.visible'
    );

    cy.get('[data-cy="ride-details"]').within(() => {
      cy.contains('Puerta del Sol').should('be.visible');
      cy.contains('Retiro').should('be.visible');
      cy.get('[data-cy="passenger-rating"]').should('be.visible');
    });

    cy.get('button').contains('Aceptar Viaje').click();

    // Step 5: Navigate to pickup location
    cy.contains('Recoger pasajero').should('be.visible');
    cy.get('[data-cy="live-tracking"]').should('be.visible');

    // Step 6: Simulate arrival
    cy.task('simulateDriverArrival');
    cy.reload();

    cy.contains('Pasajero recogido').should('be.visible', { timeout: 10000 });

    // Step 7: Start ride
    cy.get('button').contains('Iniciar Viaje').click();
    cy.contains('Viaje en progreso').should('be.visible');

    // Step 8: Complete ride
    cy.task('simulateRideEndpoint');
    cy.reload();

    cy.get('button').contains('Completar Viaje').click();

    // Step 9: Rate passenger
    cy.get('[data-cy="passenger-rating-section"]').should('be.visible');
    cy.get('[data-cy="star-5"]').click();
    cy.get('textarea[data-cy="rating-comment"]').type(
      'Pasajero amable y respetuoso'
    );
    cy.get('button').contains('Enviar Calificación').click();

    cy.contains('Calificación registrada exitosamente').should('be.visible');

    // Step 10: View earnings
    cy.visit('http://localhost:3000/profile/earnings');
    cy.contains('Ganancias hoy').should('be.visible');
    cy.contains('Viajes completados').should('contain', '1');

    // Step 11: Go offline
    cy.visit('http://localhost:3000/dashboard');
    cy.get('[data-cy="go-offline-button"]').click();
    cy.contains('Fuera de línea').should('be.visible');
  });

  it('should complete admin review workflow', () => {
    // Step 1: Login as admin
    cy.visit('http://localhost:3000/login');
    cy.get('input[placeholder="Email"]').type('admin@example.com');
    cy.get('input[placeholder="Contraseña"]').type('AdminPassword123!');
    cy.get('button').contains('Iniciar Sesión').click();

    cy.url().should('include', '/admin/dashboard');

    // Step 2: View dashboard metrics
    cy.contains('Panel de Administración').should('be.visible');
    cy.get('[data-cy="total-users"]').should('be.visible');
    cy.get('[data-cy="total-rides"]').should('be.visible');
    cy.get('[data-cy="total-revenue"]').should('be.visible');

    // Step 3: Review users
    cy.get('button').contains('Gestión de Usuarios').click();
    cy.url().should('include', '/admin/users');

    cy.get('[data-cy="user-list"]').should('be.visible');
    cy.get('[data-cy="user-item"]').first().click();

    cy.url().should('include', '/admin/users/');
    cy.contains('Detalles del Usuario').should('be.visible');

    // Step 4: Review ride history
    cy.get('button').contains('Historial de Viajes').click();
    cy.contains('Viajes Completados').should('be.visible');

    // Step 5: Manage payments
    cy.visit('http://localhost:3000/admin/payments');
    cy.contains('Gestión de Pagos').should('be.visible');

    cy.get('[data-cy="payment-list"]').should('be.visible');
    cy.get('[data-cy="payment-item"]')
      .first()
      .within(() => {
        cy.contains('$').should('be.visible');
        cy.get('[data-cy="payment-status"]').should('be.visible');
      });

    // Step 6: Review reports
    cy.visit('http://localhost:3000/admin/reports');
    cy.contains('Reportes').should('be.visible');

    cy.get('[data-cy="date-range-picker"]').should('be.visible');
    cy.get('button').contains('Generar Reporte').click();

    cy.contains('Reporte Generado').should('be.visible');

    // Step 7: View analytics
    cy.visit('http://localhost:3000/admin/analytics');
    cy.contains('Análisis').should('be.visible');

    cy.get('[data-cy="chart-rides-per-day"]').should('be.visible');
    cy.get('[data-cy="chart-revenue-trend"]').should('be.visible');

    // Step 8: Manage disputes (if any)
    cy.visit('http://localhost:3000/admin/disputes');

    cy.get('[data-cy="dispute-list"]').then(($list) => {
      if ($list.find('[data-cy="dispute-item"]').length > 0) {
        cy.get('[data-cy="dispute-item"]').first().click();

        cy.contains('Detalles del Reclamo').should('be.visible');
        cy.get('textarea[data-cy="resolution-comment"]').type(
          'Reembolso procesado'
        );
        cy.get('button').contains('Resolver').click();

        cy.contains('Reclamo resuelto').should('be.visible');
      }
    });
  });

  it('should handle complete customer support interaction', () => {
    // Step 1: Login as user
    cy.visit('http://localhost:3000/login');
    cy.get('input[placeholder="Email"]').type('test@example.com');
    cy.get('input[placeholder="Contraseña"]').type('Password123!');
    cy.get('button').contains('Iniciar Sesión').click();

    // Step 2: Open support chat
    cy.visit('http://localhost:3000/dashboard');
    cy.get('[data-cy="support-button"]').click();

    cy.get('[data-cy="chat-window"]').should('be.visible');

    // Step 3: Send message
    cy.get('input[data-cy="chat-input"]').type(
      'Tengo un problema con mi último viaje'
    );
    cy.get('button').contains('Enviar').click();

    cy.contains('Tengo un problema con mi último viaje').should('be.visible');

    // Step 4: Receive support response
    cy.get('[data-cy="chat-message"]', { timeout: 5000 })
      .last()
      .within(() => {
        cy.contains('Agente de Soporte').should('be.visible');
      });

    // Step 5: Escalate if needed
    cy.get('button').contains('Escalar a Agente').click();
    cy.contains('Conectando con un agente').should('be.visible');

    // Step 6: Close chat
    cy.get('button').contains('Cerrar Chat').click();
    cy.get('[data-cy="chat-window"]').should('not.be.visible');
  });
});
