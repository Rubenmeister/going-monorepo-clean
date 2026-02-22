/// <reference types="cypress" />

describe('Error Handling & Edge Cases', () => {
  it('should handle network timeout gracefully', () => {
    cy.visit('http://localhost:3000');

    // Throttle network to simulate timeout
    cy.intercept('GET', '**/api/**', (req) => {
      req.reply((res) => {
        res.delay(35000); // Longer than default timeout
      });
    }).as('timeoutRequest');

    cy.get('button').contains('Reservas').click();

    // Should show timeout error
    cy.contains('Error de conexión', { timeout: 40000 }).should('be.visible');

    // Retry button should be available
    cy.get('button').contains('Reintentar').should('be.visible');
  });

  it('should handle server 500 error gracefully', () => {
    cy.visit('http://localhost:3000');
    cy.login('test@example.com', 'Password123!');

    // Mock 500 error
    cy.intercept('GET', '**/api/bookings', {
      statusCode: 500,
      body: {
        message: 'Error interno del servidor',
        error: 'Internal Server Error',
      },
    }).as('serverError');

    cy.visit('http://localhost:3000/bookings');

    // Should show error page
    cy.contains('Error 500').should('be.visible');
    cy.contains('Error interno del servidor').should('be.visible');

    // Should offer navigation options
    cy.get('button').contains('Volver al Inicio').should('be.visible');
    cy.get('button').contains('Contactar Soporte').should('be.visible');

    // Clicking home should navigate
    cy.get('button').contains('Volver al Inicio').click();
    cy.url().should('include', '/dashboard');
  });

  it('should handle 404 not found error', () => {
    cy.visit('http://localhost:3000/non-existent-page');

    // Should show 404 page
    cy.contains('404').should('be.visible');
    cy.contains('Página no encontrada').should('be.visible');

    // Should offer navigation options
    cy.get('button').contains('Volver al Inicio').should('be.visible');

    // Navigate back
    cy.get('button').contains('Volver al Inicio').click();
    cy.url().should('include', '/');
  });

  it('should validate form inputs and show errors', () => {
    cy.visit('http://localhost:3000/auth/register');

    // Submit empty form
    cy.get('button').contains('Registrarse').click();

    // Should show validation errors
    cy.contains('El nombre es requerido').should('be.visible');
    cy.contains('El apellido es requerido').should('be.visible');
    cy.contains('El email es requerido').should('be.visible');
    cy.contains('La contraseña es requerida').should('be.visible');
  });

  it('should validate email format', () => {
    cy.visit('http://localhost:3000/auth/register');

    // Enter invalid email
    cy.get('input[placeholder="Nombre"]').type('Juan');
    cy.get('input[placeholder="Apellido"]').type('Pérez');
    cy.get('input[placeholder="Email"]').type('invalid-email');
    cy.get('input[placeholder="Contraseña"]').type('Password123!');

    // Blur to trigger validation
    cy.get('input[placeholder="Email"]').blur();

    // Should show email validation error
    cy.contains('Email inválido').should('be.visible');
  });

  it('should validate password strength', () => {
    cy.visit('http://localhost:3000/auth/register');

    // Enter weak password
    cy.get('input[placeholder="Contraseña"]').type('123');

    // Blur to trigger validation
    cy.get('input[placeholder="Contraseña"]').blur();

    // Should show strength warning
    cy.contains('La contraseña es demasiado débil').should('be.visible');
    cy.contains('Requiere al menos 8 caracteres').should('be.visible');
  });

  it('should handle concurrent requests', () => {
    cy.visit('http://localhost:3000');
    cy.login('test@example.com', 'Password123!');

    cy.visit('http://localhost:3000/dashboard');

    // Simulate multiple concurrent requests
    cy.get('button').contains('Reservas').click();
    cy.get('button').contains('Mis Viajes').click();
    cy.get('button').contains('Pagos').click();

    // All should load without errors
    cy.get('[data-cy="bookings-section"]', { timeout: 10000 }).should(
      'be.visible'
    );
    cy.get('[data-cy="trips-section"]', { timeout: 10000 }).should(
      'be.visible'
    );
    cy.get('[data-cy="payments-section"]', { timeout: 10000 }).should(
      'be.visible'
    );
  });

  it('should handle expired session gracefully', () => {
    cy.visit('http://localhost:3000');
    cy.login('test@example.com', 'Password123!');

    cy.visit('http://localhost:3000/dashboard');

    // Clear session storage/cookies to simulate expired session
    cy.clearCookie('sessionId');
    cy.clearLocalStorage('token');

    // Try to access protected page
    cy.visit('http://localhost:3000/bookings');

    // Should redirect to login
    cy.url().should('include', '/login');
    cy.contains('Su sesión ha expirado').should('be.visible');
  });

  it('should handle missing required data', () => {
    cy.visit('http://localhost:3000');
    cy.login('test@example.com', 'Password123!');

    // Mock API to return incomplete data
    cy.intercept('GET', '**/api/bookings/**', {
      statusCode: 200,
      body: {
        id: '123',
        // Missing required fields like origin, destination
      },
    }).as('incompleteData');

    cy.visit('http://localhost:3000/booking/123');

    // Should show appropriate error
    cy.contains('Datos incompletos').should('be.visible');
  });

  it('should handle payment authorization failure', () => {
    cy.visit('http://localhost:3000');
    cy.login('test@example.com', 'Password123!');

    // Mock payment endpoint to return authorization failure
    cy.intercept('POST', '**/api/payments/**', {
      statusCode: 402,
      body: {
        error: 'payment_method_rejected',
        message: 'Your payment method was rejected',
      },
    }).as('paymentFailed');

    cy.visit('http://localhost:3000/checkout');

    // Proceed with payment
    cy.get('button').contains('Pagar ahora').click();

    // Should show payment declined message
    cy.contains('Tu método de pago fue rechazado').should('be.visible');

    // Should offer alternative payment methods
    cy.get('[data-cy="alternative-payment-methods"]').should('be.visible');
  });

  it('should handle database connection errors', () => {
    cy.visit('http://localhost:3000');

    // Mock database error
    cy.intercept('GET', '**/api/health', {
      statusCode: 503,
      body: {
        status: 'unhealthy',
        message: 'Database connection failed',
      },
    }).as('dbError');

    cy.visit('http://localhost:3000/api/health');

    // Should show service unavailable message
    cy.contains('Servicio no disponible').should('be.visible');
    cy.contains('Por favor intente más tarde').should('be.visible');
  });

  it('should prevent XSS attacks', () => {
    cy.visit('http://localhost:3000/auth/register');

    // Try to inject script
    cy.get('input[placeholder="Nombre"]').type('<script>alert("xss")</script>');
    cy.get('input[placeholder="Apellido"]').type('Test');
    cy.get('input[placeholder="Email"]').type('test@example.com');
    cy.get('input[placeholder="Contraseña"]').type('Password123!');

    cy.get('button').contains('Registrarse').click();

    // Script should not execute
    // Verify by checking if page is still intact
    cy.contains('Error').should('be.visible'); // Should show validation error instead
  });

  it('should handle file upload errors', () => {
    cy.visit('http://localhost:3000');
    cy.login('test@example.com', 'Password123!');

    cy.visit('http://localhost:3000/profile/upload');

    // Try to upload invalid file type
    cy.get('input[type="file"]').selectFile(
      'cypress/fixtures/invalid-file.txt'
    );

    // Should show file type error
    cy.contains('Tipo de archivo no válido').should('be.visible');
    cy.contains('Solo se permiten imágenes').should('be.visible');
  });

  it('should handle rate limiting gracefully', () => {
    cy.visit('http://localhost:3000');

    // Mock rate limit response
    cy.intercept('POST', '**/api/auth/login', (req, res) => {
      res.reply({
        statusCode: 429,
        headers: {
          'Retry-After': '60',
        },
        body: {
          error: 'too_many_requests',
          message: 'Too many login attempts. Please try again in 60 seconds.',
        },
      });
    }).as('rateLimited');

    cy.get('input[placeholder="Email"]').type('test@example.com');
    cy.get('input[placeholder="Contraseña"]').type('Password123!');
    cy.get('button').contains('Iniciar Sesión').click();

    // Should show rate limit message
    cy.contains('Demasiados intentos').should('be.visible');
    cy.contains('Por favor intente en 60 segundos').should('be.visible');
  });

  it('should recover from partial data loading', () => {
    cy.visit('http://localhost:3000');
    cy.login('test@example.com', 'Password123!');

    // Mock partial data response
    cy.intercept('GET', '**/api/bookings', {
      statusCode: 206, // Partial Content
      body: {
        data: [],
        total: 100,
        loaded: 20,
        message: 'Partial data loaded',
      },
    }).as('partialData');

    cy.visit('http://localhost:3000/bookings');

    // Should show loading indicator
    cy.get('[data-cy="loading-indicator"]').should('be.visible');

    // Should have option to load more
    cy.get('button').contains('Cargar más').should('be.visible');

    cy.get('button').contains('Cargar más').click();

    // Should load remaining data
    cy.get('[data-cy="booking-item"]').should('have.length.greaterThan', 0);
  });
});
