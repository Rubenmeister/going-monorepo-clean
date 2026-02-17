/// <reference types="cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('should display login page', () => {
    cy.contains('Iniciar Sesión').should('be.visible');
  });

  it('should register a new user', () => {
    cy.contains('¿No tienes cuenta?').click();
    cy.get('input[placeholder="Nombre"]').type('Juan');
    cy.get('input[placeholder="Apellido"]').type('Pérez');
    cy.get('input[placeholder="Email"]').type('juan@example.com');
    cy.get('input[placeholder="Contraseña"]').type('Password123!');
    cy.contains('Registrarse').click();
    cy.url().should('include', '/dashboard');
  });

  it('should login with valid credentials', () => {
    cy.get('input[placeholder="Email"]').type('test@example.com');
    cy.get('input[placeholder="Contraseña"]').type('Password123!');
    cy.contains('Iniciar Sesión').click();
    cy.url().should('include', '/dashboard');
  });

  it('should show error with invalid credentials', () => {
    cy.get('input[placeholder="Email"]').type('invalid@example.com');
    cy.get('input[placeholder="Contraseña"]').type('WrongPassword');
    cy.contains('Iniciar Sesión').click();
    cy.contains('Error').should('be.visible');
  });
});

describe('Booking Flow', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'Password123!');
    cy.visit('http://localhost:3000/dashboard');
  });

  it('should create a new booking', () => {
    cy.contains('Reservas').click();
    cy.contains('Crear Reserva').click();
    cy.get('input[placeholder="Tipo de Servicio"]').type('transport');
    cy.get('input[placeholder="Cantidad"]').type('100');
    cy.contains('Crear').click();
    cy.contains('Reserva creada exitosamente').should('be.visible');
  });

  it('should view user bookings', () => {
    cy.contains('Reservas').click();
    cy.get('table').should('be.visible');
  });

  it('should confirm a booking', () => {
    cy.contains('Reservas').click();
    cy.contains('Ver').first().click();
    cy.contains('Confirmar').click();
    cy.contains('Estado').should('contain', 'confirmed');
  });
});

describe('Admin Dashboard', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.visit('http://localhost:3000/admin');
  });

  it('should display admin dashboard', () => {
    cy.contains('Panel de Administración').should('be.visible');
  });

  it('should navigate to bookings management', () => {
    cy.contains('Gestión de Reservas').click();
    cy.url().should('include', '/admin/bookings');
  });

  it('should navigate to users management', () => {
    cy.contains('Gestión de Usuarios').click();
    cy.url().should('include', '/admin/users');
  });

  it('should navigate to payments management', () => {
    cy.contains('Gestión de Pagos').click();
    cy.url().should('include', '/admin/payments');
  });
});
