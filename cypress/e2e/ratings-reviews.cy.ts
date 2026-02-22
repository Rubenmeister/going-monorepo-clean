/// <reference types="cypress" />

describe('Ratings & Reviews', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.login('test@example.com', 'Password123!');
  });

  it('should rate driver after ride completion', () => {
    // Complete a ride first
    cy.visit('http://localhost:3000/dashboard');
    cy.contains('Mis Viajes').click();

    // Find completed ride
    cy.contains('Completado')
      .first()
      .parent()
      .within(() => {
        cy.contains('Ver Detalles').click();
      });

    cy.url().should('include', '/ride/');

    // Verify rating section is available
    cy.get('[data-cy="rating-section"]').should('be.visible');

    // Rate driver (5 stars)
    cy.get('[data-cy="star-5"]').click();

    // Verify stars are selected
    cy.get('[data-cy="star-1"]').should('have.class', 'selected');
    cy.get('[data-cy="star-2"]').should('have.class', 'selected');
    cy.get('[data-cy="star-3"]').should('have.class', 'selected');
    cy.get('[data-cy="star-4"]').should('have.class', 'selected');
    cy.get('[data-cy="star-5"]').should('have.class', 'selected');

    // Add comment
    cy.get('textarea[data-cy="rating-comment"]').type(
      'Excelente conductor, muy profesional y puntual. Volveré a usar este servicio.'
    );

    // Submit rating
    cy.get('button').contains('Enviar Calificación').click();

    // Verify success
    cy.contains('Calificación registrada exitosamente').should('be.visible');

    // Verify rating is displayed
    cy.get('[data-cy="your-rating"]').should('contain', '5');
    cy.get('[data-cy="your-comment"]').should('contain', 'Excelente conductor');
  });

  it('should rate passenger after ride completion (driver view)', () => {
    // Login as driver
    cy.visit('http://localhost:3000/login');
    cy.get('input[placeholder="Email"]').type('driver@example.com');
    cy.get('input[placeholder="Contraseña"]').type('Password123!');
    cy.get('button').contains('Iniciar Sesión').click();

    cy.visit('http://localhost:3000/dashboard');
    cy.contains('Mis Viajes').click();

    // Find completed ride
    cy.contains('Completado')
      .first()
      .parent()
      .within(() => {
        cy.contains('Ver Detalles').click();
      });

    cy.url().should('include', '/ride/');

    // Verify passenger rating section
    cy.get('[data-cy="passenger-rating-section"]').should('be.visible');

    // Rate passenger (4 stars)
    cy.get('[data-cy="star-4"]').click();

    // Add comment
    cy.get('textarea[data-cy="rating-comment"]').type(
      'Pasajero educado y respetuoso. Buen viaje.'
    );

    // Submit rating
    cy.get('button').contains('Enviar Calificación').click();

    // Verify success
    cy.contains('Calificación registrada exitosamente').should('be.visible');
  });

  it('should display driver ratings on profile', () => {
    // Navigate to driver profile
    cy.visit('http://localhost:3000/drivers/driver-123');

    // Verify rating information is displayed
    cy.get('[data-cy="driver-rating"]').should('be.visible');
    cy.get('[data-cy="average-rating"]').should('contain', '4');
    cy.get('[data-cy="review-count"]').should('contain', 'reseña');

    // Verify rating breakdown
    cy.get('[data-cy="rating-breakdown"]').should('be.visible');
    cy.get('[data-cy="five-star-count"]').should('be.visible');
    cy.get('[data-cy="four-star-count"]').should('be.visible');
    cy.get('[data-cy="three-star-count"]').should('be.visible');
    cy.get('[data-cy="two-star-count"]').should('be.visible');
    cy.get('[data-cy="one-star-count"]').should('be.visible');
  });

  it('should display reviews on driver profile', () => {
    // Navigate to driver profile
    cy.visit('http://localhost:3000/drivers/driver-123');

    // Scroll to reviews section
    cy.get('[data-cy="reviews-section"]').scrollIntoView();

    // Verify reviews are displayed
    cy.get('[data-cy="review-item"]').should('have.length.greaterThan', 0);

    // Verify each review shows rating, comment, and date
    cy.get('[data-cy="review-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="review-rating"]').should('be.visible');
        cy.get('[data-cy="review-comment"]').should('be.visible');
        cy.get('[data-cy="review-date"]').should('be.visible');
        cy.get('[data-cy="reviewer-name"]').should('be.visible');
      });
  });

  it('should filter reviews by rating', () => {
    cy.visit('http://localhost:3000/drivers/driver-123');

    cy.get('[data-cy="reviews-section"]').scrollIntoView();

    // Get initial review count
    cy.get('[data-cy="review-item"]').then(($items) => {
      const totalCount = $items.length;

      // Filter by 5 stars
      cy.get('input[data-cy="filter-5-stars"]').click();

      // Verify only 5-star reviews shown
      cy.get('[data-cy="review-item"]').each(($review) => {
        cy.wrap($review)
          .get('[data-cy="review-rating"]')
          .should('contain', '5');
      });

      // Verify count changed
      cy.get('[data-cy="review-item"]').then(($filtered) => {
        expect($filtered.length).to.be.lessThan(totalCount);
      });

      // Clear filter
      cy.get('input[data-cy="filter-5-stars"]').uncheck();

      // Verify all reviews shown again
      cy.get('[data-cy="review-item"]').should('have.length', totalCount);
    });
  });

  it('should sort reviews by date and rating', () => {
    cy.visit('http://localhost:3000/drivers/driver-123');

    cy.get('[data-cy="reviews-section"]').scrollIntoView();

    // Get review dates
    const dates = [];
    cy.get('[data-cy="review-date"]').each(($date) => {
      dates.push($date.text());
    });

    // Sort by newest first
    cy.get('[data-cy="sort-select"]').select('newest');

    // Verify order changed
    cy.get('[data-cy="review-date"]').first().should('contain', dates[0]);

    // Sort by highest rating
    cy.get('[data-cy="sort-select"]').select('highest-rating');

    // Verify first review has 5 stars
    cy.get('[data-cy="review-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="review-rating"]').should('contain', '5');
      });
  });

  it('should not allow rating same ride twice', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.contains('Mis Viajes').click();

    // Find already rated ride
    cy.contains('Calificado')
      .first()
      .parent()
      .within(() => {
        cy.contains('Ver Detalles').click();
      });

    // Verify rating form is disabled
    cy.get('[data-cy="rating-section"]').should('have.class', 'disabled');
    cy.get('button').contains('Enviar Calificación').should('be.disabled');

    // Verify existing rating is displayed
    cy.get('[data-cy="your-rating"]').should('be.visible');
  });

  it('should report inappropriate review', () => {
    cy.visit('http://localhost:3000/drivers/driver-123');

    cy.get('[data-cy="reviews-section"]').scrollIntoView();

    // Find a review
    cy.get('[data-cy="review-item"]')
      .first()
      .within(() => {
        // Click report button
        cy.get('[data-cy="report-review"]').click();
      });

    // Verify report modal appears
    cy.get('[data-cy="report-modal"]').should('be.visible');

    // Select reason
    cy.get('select[data-cy="report-reason"]').select('offensive');

    // Add comment
    cy.get('textarea[data-cy="report-comment"]').type(
      'This review contains offensive language'
    );

    // Submit report
    cy.get('button').contains('Reportar').click();

    // Verify success
    cy.contains('Reporte enviado exitosamente').should('be.visible');
  });

  it('should respond to review (driver)', () => {
    // Login as driver
    cy.visit('http://localhost:3000/login');
    cy.get('input[placeholder="Email"]').type('driver@example.com');
    cy.get('input[placeholder="Contraseña"]').type('Password123!');
    cy.get('button').contains('Iniciar Sesión').click();

    cy.visit('http://localhost:3000/profile/reviews');

    // Find review without response
    cy.get('[data-cy="review-without-response"]')
      .first()
      .within(() => {
        cy.get('[data-cy="respond-button"]').click();
      });

    // Verify response form appears
    cy.get('[data-cy="response-form"]').should('be.visible');

    // Type response
    cy.get('textarea[data-cy="response-text"]').type(
      'Muchas gracias por viajar con nosotros. Nos complace haber ofrecido un servicio de calidad.'
    );

    // Submit response
    cy.get('button').contains('Enviar Respuesta').click();

    // Verify success
    cy.contains('Respuesta enviada exitosamente').should('be.visible');
  });
});
