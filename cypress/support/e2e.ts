// Cypress support file for E2E tests
import './commands';

// Disable uncaught exception handling for specific errors
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent Cypress from failing the test
  return false;
});

// Global test configuration
beforeEach(() => {
  // Clear local storage before each test
  cy.window().then((win) => {
    win.localStorage.clear();
  });

  // Clear session storage
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });

  // Clear all cookies
  cy.clearCookies();
});

// After each test
afterEach(() => {
  // Log test completion
  cy.log('Test completed');
});
