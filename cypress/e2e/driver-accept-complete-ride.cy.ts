describe('Driver - Accept and Complete Ride Flow', () => {
  beforeEach(() => {
    // Login as driver
    cy.visit('http://localhost:3000/driver');
    cy.get('[data-testid="login-email"]').type('driver@test.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/driver/dashboard');

    // Go online
    cy.get('[data-testid="go-online-button"]').click();
    cy.get('[data-testid="online-status"]').should('contain', 'Online');
  });

  it('should accept ride and complete full delivery', () => {
    // Step 1: Wait for ride request
    cy.get('[data-testid="ride-notification"]', { timeout: 30000 }).should(
      'be.visible'
    );

    // Verify ride details in notification
    cy.get('[data-testid="notification-passenger-name"]').should('be.visible');
    cy.get('[data-testid="notification-pickup"]').should('be.visible');
    cy.get('[data-testid="notification-dropoff"]').should('be.visible');
    cy.get('[data-testid="notification-fare"]').should('be.visible');

    // Step 2: Accept ride
    cy.get('[data-testid="accept-ride-button"]').click();

    // Verify acceptance
    cy.get('[data-testid="ride-status"]').should('contain', 'Accepted');
    cy.get('[data-testid="passenger-info"]').should('be.visible');
    cy.get('[data-testid="passenger-phone"]').should('be.visible');
    cy.get('[data-testid="passenger-photo"]').should('be.visible');

    // Step 3: Navigate to pickup
    cy.get('[data-testid="navigation-button"]').click();
    cy.get('[data-testid="pickup-address"]').should('be.visible');
    cy.get('[data-testid="distance-to-pickup"]').should('be.visible');
    cy.get('[data-testid="eta-to-pickup"]').should('be.visible');

    // Step 4: Arrive at pickup location
    cy.get('[data-testid="arrive-button"]', { timeout: 15000 }).should(
      'not.be.disabled'
    );
    cy.get('[data-testid="arrive-button"]').click();

    // Verify arrival
    cy.get('[data-testid="ride-status"]').should('contain', 'Arrived');
    cy.get('[data-testid="start-ride-button"]').should('be.visible');

    // Step 5: Passenger boards (wait a bit)
    cy.wait(3000);

    // Start ride
    cy.get('[data-testid="start-ride-button"]').click();
    cy.get('[data-testid="ride-status"]').should('contain', 'In Progress');

    // Step 6: Real-time navigation
    cy.get('[data-testid="live-map"]').should('be.visible');
    cy.get('[data-testid="next-turn"]').should('be.visible');
    cy.get('[data-testid="distance-remaining"]').should('be.visible');
    cy.get('[data-testid="eta-remaining"]').should('be.visible');

    // Step 7: Arrive at dropoff
    cy.get('[data-testid="arrive-button"]', { timeout: 20000 }).should(
      'not.be.disabled'
    );
    cy.get('[data-testid="arrive-button"]').click();

    // Verify completion
    cy.get('[data-testid="ride-status"]').should('contain', 'Completed');
    cy.get('[data-testid="ride-summary"]').should('be.visible');
    cy.get('[data-testid="trip-distance"]').should('be.visible');
    cy.get('[data-testid="trip-duration"]').should('be.visible');
    cy.get('[data-testid="trip-fare"]').should('be.visible');

    // Step 8: Payment processed notification
    cy.get('[data-testid="payment-notification"]', { timeout: 10000 }).should(
      'be.visible'
    );
    cy.get('[data-testid="payment-amount"]').should('contain', '$');

    // Step 9: Available for next ride
    cy.get('[data-testid="ready-for-next"]', { timeout: 5000 }).should(
      'be.visible'
    );
    cy.get('[data-testid="online-status"]').should('contain', 'Online');
  });

  it('should display driver earnings after ride completion', () => {
    // Accept and complete a ride (simplified)
    cy.get('[data-testid="ride-notification"]', { timeout: 30000 }).should(
      'be.visible'
    );
    cy.get('[data-testid="accept-ride-button"]').click();
    cy.get('[data-testid="arrive-button"]', { timeout: 15000 }).click();
    cy.get('[data-testid="start-ride-button"]').click();
    cy.get('[data-testid="arrive-button"]', { timeout: 20000 }).click();

    // Verify earnings display
    cy.get('[data-testid="earnings-summary"]').should('be.visible');
    cy.get('[data-testid="ride-earnings"]').should('be.visible');
    cy.get('[data-testid="total-earnings-today"]').should('be.visible');

    // Check ride history updated
    cy.get('[data-testid="completed-rides-count"]').should('be.visible');
  });

  it('should track driver rating after ride', () => {
    // Complete a ride
    cy.get('[data-testid="ride-notification"]', { timeout: 30000 }).should(
      'be.visible'
    );
    cy.get('[data-testid="accept-ride-button"]').click();
    cy.get('[data-testid="arrive-button"]', { timeout: 15000 }).click();
    cy.get('[data-testid="start-ride-button"]').click();
    cy.get('[data-testid="arrive-button"]', { timeout: 20000 }).click();

    // Check profile section
    cy.get('[data-testid="driver-profile-button"]').click();
    cy.get('[data-testid="profile-average-rating"]').should('be.visible');
    cy.get('[data-testid="profile-total-ratings"]').should('be.visible');
    cy.get('[data-testid="profile-completed-trips"]').should('be.visible');

    // Verify badges if applicable
    if (cy.get('[data-testid="profile-badge"]')) {
      cy.get('[data-testid="profile-badge"]').each(($badge) => {
        expect(['Super Driver', 'Highly Rated']).to.include($badge.text());
      });
    }
  });

  it('should allow driver to go offline', () => {
    // Verify online status
    cy.get('[data-testid="online-status"]').should('contain', 'Online');

    // Go offline
    cy.get('[data-testid="go-offline-button"]').click();
    cy.get('[data-testid="confirm-offline"]').click();

    // Verify offline
    cy.get('[data-testid="online-status"]').should('contain', 'Offline');
    cy.get('[data-testid="ride-notification"]').should('not.be.visible');
  });

  it('should display driver statistics dashboard', () => {
    cy.get('[data-testid="statistics-section"]').should('be.visible');

    // Today's statistics
    cy.get('[data-testid="todays-earnings"]').should('be.visible');
    cy.get('[data-testid="todays-rides"]').should('be.visible');
    cy.get('[data-testid="todays-hours"]').should('be.visible');
    cy.get('[data-testid="average-rating-today"]').should('be.visible');

    // Weekly statistics
    cy.get('[data-testid="weekly-earnings"]').should('be.visible');
    cy.get('[data-testid="weekly-rides"]').should('be.visible');

    // Ratings breakdown
    cy.get('[data-testid="rating-distribution"]').should('be.visible');
    cy.get('[data-testid="five-star-count"]').should('be.visible');
    cy.get('[data-testid="four-star-count"]').should('be.visible');
  });

  it('should show payout information for driver', () => {
    cy.get('[data-testid="earnings-menu"]').click();
    cy.get('[data-testid="payout-section"]').should('be.visible');

    // Payout details
    cy.get('[data-testid="payout-amount"]').should('be.visible');
    cy.get('[data-testid="payout-date"]').should('be.visible');
    cy.get('[data-testid="payout-status"]').should('be.visible');

    // Bank account info
    cy.get('[data-testid="bank-account"]').should('be.visible');
    cy.get('[data-testid="bank-account-last-digits"]').should('be.visible');
  });

  it('should handle ride cancellation by driver', () => {
    // Get ride notification
    cy.get('[data-testid="ride-notification"]', { timeout: 30000 }).should(
      'be.visible'
    );

    // Access ride options
    cy.get('[data-testid="ride-options-button"]').click();
    cy.get('[data-testid="cancel-ride-button"]').should('be.visible');

    // Cancel ride
    cy.get('[data-testid="cancel-ride-button"]').click();
    cy.get('[data-testid="cancel-reason-dropdown"]').click();
    cy.get('[data-testid="cancel-reason-traffic"]').click();
    cy.get('[data-testid="confirm-cancellation"]').click();

    // Verify cancellation
    cy.get('[data-testid="cancellation-confirmation"]').should('contain', 'cancelled');

    // Verify still online for next ride
    cy.get('[data-testid="online-status"]').should('contain', 'Online');
  });

  it('should maintain driver location sharing during ride', () => {
    // Accept a ride
    cy.get('[data-testid="ride-notification"]', { timeout: 30000 }).should(
      'be.visible'
    );
    cy.get('[data-testid="accept-ride-button"]').click();

    // Verify location sharing
    cy.get('[data-testid="location-sharing-badge"]').should('be.visible');

    // Navigate and arrive
    cy.get('[data-testid="arrive-button"]', { timeout: 15000 }).click();
    cy.get('[data-testid="start-ride-button"]').click();

    // Location should continue to be shared
    cy.get('[data-testid="live-map"]').should('be.visible');
    cy.get('[data-testid="location-sharing-badge"]').should('be.visible');
  });
});
