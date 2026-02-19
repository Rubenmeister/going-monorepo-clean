// Custom Cypress commands

/**
 * Custom login command
 */
Cypress.Commands.add('loginAsPassenger', (email = 'passenger@test.com', password = 'password123') => {
  cy.visit('http://localhost:3000');
  cy.get('[data-testid="login-email"]').type(email);
  cy.get('[data-testid="login-password"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('loginAsDriver', (email = 'driver@test.com', password = 'password123') => {
  cy.visit('http://localhost:3000/driver');
  cy.get('[data-testid="login-email"]').type(email);
  cy.get('[data-testid="login-password"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('include', '/driver/dashboard');
});

Cypress.Commands.add('loginAsAdmin', (email = 'admin@test.com', password = 'admin123') => {
  cy.visit('http://localhost:3001/admin');
  cy.get('[data-testid="login-email"]').type(email);
  cy.get('[data-testid="login-password"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('include', '/admin/dashboard');
});

Cypress.Commands.add('requestRide', (pickup, dropoff) => {
  cy.get('[data-testid="request-ride-button"]').click();
  cy.get('[data-testid="pickup-location-input"]').click().type(pickup);
  cy.get('[data-testid="location-suggestion-0"]').click();
  cy.get('[data-testid="dropoff-location-input"]').click().type(dropoff);
  cy.get('[data-testid="location-suggestion-0"]').click();
  cy.get('[data-testid="confirm-ride-button"]').click();
  cy.get('[data-testid="trip-id"]').should('be.visible');
});

Cypress.Commands.add('acceptRide', () => {
  cy.get('[data-testid="ride-notification"]', { timeout: 30000 }).should('be.visible');
  cy.get('[data-testid="accept-ride-button"]').click();
  cy.get('[data-testid="ride-status"]').should('contain', 'Accepted');
});

Cypress.Commands.add('completeRide', () => {
  cy.get('[data-testid="arrive-button"]', { timeout: 15000 }).click();
  cy.get('[data-testid="start-ride-button"]').click();
  cy.get('[data-testid="arrive-button"]', { timeout: 20000 }).click();
  cy.get('[data-testid="ride-status"]').should('contain', 'Completed');
});

Cypress.Commands.add('goOnline', () => {
  cy.get('[data-testid="go-online-button"]').click();
  cy.get('[data-testid="online-status"]').should('contain', 'Online');
});

Cypress.Commands.add('goOffline', () => {
  cy.get('[data-testid="go-offline-button"]').click();
  cy.get('[data-testid="confirm-offline"]').click();
  cy.get('[data-testid="online-status"]').should('contain', 'Offline');
});
