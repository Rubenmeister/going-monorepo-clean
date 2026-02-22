/// <reference types="cypress" />

describe('User Profile Management', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.login('test@example.com', 'Password123!');
    cy.visit('http://localhost:3000/profile');
  });

  it('should display user profile page', () => {
    cy.contains('Mi Perfil').should('be.visible');
    cy.get('input[data-cy="profile-name"]').should('be.visible');
    cy.get('input[data-cy="profile-email"]').should('be.visible');
    cy.get('input[data-cy="profile-phone"]').should('be.visible');
  });

  it('should update user profile information', () => {
    // Clear existing name and type new one
    cy.get('input[data-cy="profile-name"]').clear().type('Juan Carlos Pérez');

    cy.get('input[data-cy="profile-phone"]').clear().type('+34 912 345 678');

    cy.get('input[data-cy="profile-address"]')
      .clear()
      .type('Calle Principal 123, Madrid');

    // Save changes
    cy.get('button').contains('Guardar Cambios').click();

    // Verify success message
    cy.contains('Perfil actualizado exitosamente').should('be.visible');

    // Reload page and verify data persisted
    cy.reload();
    cy.get('input[data-cy="profile-name"]').should(
      'have.value',
      'Juan Carlos Pérez'
    );
    cy.get('input[data-cy="profile-phone"]').should(
      'have.value',
      '+34 912 345 678'
    );
    cy.get('input[data-cy="profile-address"]').should(
      'have.value',
      'Calle Principal 123, Madrid'
    );
  });

  it('should upload and change profile photo', () => {
    // Click on profile photo
    cy.get('[data-cy="profile-photo"]').click();

    // Upload photo
    const fileName = 'profile-photo.jpg';
    cy.get('input[type="file"]').selectFile(`cypress/fixtures/${fileName}`);

    // Wait for preview
    cy.get('[data-cy="photo-preview"]').should('be.visible');

    // Adjust crop if available
    cy.get('[data-cy="crop-button"]').click();
    cy.get('[data-cy="crop-confirm"]').click();

    // Save photo
    cy.get('button').contains('Guardar Foto').click();

    // Verify success
    cy.contains('Foto de perfil actualizada').should('be.visible');

    // Verify photo display updated
    cy.reload();
    cy.get('[data-cy="profile-photo"]').should('exist');
  });

  it('should manage document verification', () => {
    // Navigate to verification section
    cy.get('button').contains('Verificación de Identidad').click();
    cy.url().should('include', '/verification');

    // Verify section displays verification status
    cy.contains('Estado de Verificación').should('be.visible');

    // If not verified, show upload options
    cy.get('[data-cy="verification-status"]').then(($status) => {
      if ($status.text().includes('No verificado')) {
        // Upload ID
        cy.get('input[data-cy="upload-id"]').selectFile(
          'cypress/fixtures/id-document.jpg'
        );
        cy.get('button').contains('Subir Documento').click();

        // Verify upload success
        cy.contains('Documento subido exitosamente').should('be.visible');

        // Upload selfie
        cy.get('input[data-cy="upload-selfie"]').selectFile(
          'cypress/fixtures/selfie.jpg'
        );
        cy.get('button').contains('Subir Selfie').click();

        // Verify upload success
        cy.contains('Selfie subida exitosamente').should('be.visible');

        // Check verification in progress
        cy.contains('En proceso de verificación').should('be.visible');
      }
    });
  });

  it('should change password', () => {
    // Navigate to security settings
    cy.get('button').contains('Configuración de Seguridad').click();
    cy.url().should('include', '/security');

    // Change password
    cy.get('input[data-cy="current-password"]').type('Password123!');
    cy.get('input[data-cy="new-password"]').type('NewPassword456!');
    cy.get('input[data-cy="confirm-password"]').type('NewPassword456!');

    // Submit
    cy.get('button').contains('Cambiar Contraseña').click();

    // Verify success
    cy.contains('Contraseña cambiada exitosamente').should('be.visible');

    // Logout and login with new password
    cy.get('button').contains('Cerrar Sesión').click();
    cy.url().should('include', '/login');

    cy.get('input[placeholder="Email"]').type('test@example.com');
    cy.get('input[placeholder="Contraseña"]').type('NewPassword456!');
    cy.get('button').contains('Iniciar Sesión').click();

    cy.url().should('include', '/dashboard');
  });

  it('should manage notification preferences', () => {
    // Navigate to notification settings
    cy.get('button').contains('Notificaciones').click();
    cy.url().should('include', '/notifications');

    // Toggle notification settings
    cy.get('input[data-cy="email-notifications"]').then(($checkbox) => {
      const isChecked = $checkbox.is(':checked');
      cy.wrap($checkbox).click();
      cy.wrap($checkbox).should(`${isChecked ? 'not.' : ''}be.checked`);
    });

    cy.get('input[data-cy="sms-notifications"]').then(($checkbox) => {
      const isChecked = $checkbox.is(':checked');
      cy.wrap($checkbox).click();
      cy.wrap($checkbox).should(`${isChecked ? 'not.' : ''}be.checked`);
    });

    cy.get('input[data-cy="push-notifications"]').then(($checkbox) => {
      const isChecked = $checkbox.is(':checked');
      cy.wrap($checkbox).click();
      cy.wrap($checkbox).should(`${isChecked ? 'not.' : ''}be.checked`);
    });

    // Save preferences
    cy.get('button').contains('Guardar Preferencias').click();

    // Verify success
    cy.contains('Preferencias guardadas').should('be.visible');
  });

  it('should view account activity and login history', () => {
    // Navigate to activity section
    cy.get('button').contains('Actividad de Cuenta').click();
    cy.url().should('include', '/activity');

    // Verify activity list is displayed
    cy.get('[data-cy="activity-list"]').should('be.visible');

    // Verify login history section
    cy.get('[data-cy="login-history"]').should('be.visible');
    cy.get('[data-cy="login-history-item"]').should(
      'have.length.greaterThan',
      0
    );

    // Verify each login shows device and location
    cy.get('[data-cy="login-history-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="device-info"]').should('be.visible');
        cy.get('[data-cy="location-info"]').should('be.visible');
        cy.get('[data-cy="timestamp"]').should('be.visible');
      });
  });

  it('should validate required fields', () => {
    // Clear required fields
    cy.get('input[data-cy="profile-name"]').clear();

    // Try to save
    cy.get('button').contains('Guardar Cambios').click();

    // Verify validation error
    cy.contains('El nombre es requerido').should('be.visible');

    // Enter valid name
    cy.get('input[data-cy="profile-name"]').type('Test User');

    // Verify error disappears
    cy.contains('El nombre es requerido').should('not.exist');

    // Save should work now
    cy.get('button').contains('Guardar Cambios').click();
    cy.contains('Perfil actualizado exitosamente').should('be.visible');
  });

  it('should delete account', () => {
    // Navigate to danger zone
    cy.get('button').contains('Eliminar Cuenta').click();

    // Verify confirmation dialog
    cy.get('[data-cy="delete-account-modal"]').should('be.visible');
    cy.contains('¿Está seguro de que desea eliminar su cuenta?').should(
      'be.visible'
    );

    // Enter confirmation text
    cy.get('input[data-cy="confirm-delete"]').type('Eliminar mi cuenta');

    // Confirm deletion
    cy.get('button').contains('Sí, eliminar mi cuenta').click();

    // Verify account deleted
    cy.url().should('include', '/account-deleted');
    cy.contains('Su cuenta ha sido eliminada').should('be.visible');

    // Verify cannot login with deleted account
    cy.visit('http://localhost:3000/login');
    cy.get('input[placeholder="Email"]').type('test@example.com');
    cy.get('input[placeholder="Contraseña"]').type('Password123!');
    cy.get('button').contains('Iniciar Sesión').click();

    cy.contains('Usuario no encontrado').should('be.visible');
  });
});
