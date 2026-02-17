// Custom Cypress commands

declare namespace Cypress {
  interface Chainable<Subject = any> {
    login(email: string, password: string): Chainable<Subject>;
    loginAsAdmin(): Chainable<Subject>;
    createBooking(data: any): Chainable<Subject>;
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('http://localhost:3000');
  cy.get('input[placeholder="Email"]').type(email);
  cy.get('input[placeholder="Contraseña"]').type(password);
  cy.contains('Iniciar Sesión').click();
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin@example.com', 'AdminPassword123!');
});

Cypress.Commands.add('createBooking', (data: any) => {
  cy.contains('Reservas').click();
  cy.contains('Crear Reserva').click();
  Object.entries(data).forEach(([key, value]) => {
    cy.get(`input[placeholder="${key}"]`).type(String(value));
  });
  cy.contains('Crear').click();
});
