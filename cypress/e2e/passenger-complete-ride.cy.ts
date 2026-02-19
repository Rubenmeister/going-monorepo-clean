describe('Passenger - Complete Ride Flow', () => {
  beforeEach(() => {
    // Login as passenger
    cy.visit('http://localhost:3000');
    cy.get('[data-testid="login-email"]').type('passenger@test.com');
    cy.get('[data-testid="login-password"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should request a ride and complete full workflow', () => {
    // Step 1: Request a ride
    cy.get('[data-testid="request-ride-button"]').click();

    // Set pickup location
    cy.get('[data-testid="pickup-location-input"]')
      .click()
      .type('123 Main St, New York, NY');
    cy.get('[data-testid="location-suggestion-0"]').click();

    // Set dropoff location
    cy.get('[data-testid="dropoff-location-input"]')
      .click()
      .type('456 Broadway, New York, NY');
    cy.get('[data-testid="location-suggestion-0"]').click();

    // Verify estimated fare
    cy.get('[data-testid="estimated-fare"]').should('be.visible');
    cy.get('[data-testid="estimated-fare"]').invoke('text').then((text) => {
      const fare = parseFloat(text.replace('$', ''));
      expect(fare).to.be.greaterThan(0);
    });

    // Submit request
    cy.get('[data-testid="confirm-ride-button"]').click();

    // Verify ride request submitted
    cy.get('[data-testid="ride-status"]').should('contain', 'Finding driver');
    cy.get('[data-testid="trip-id"]').should('be.visible');

    // Step 2: Wait for driver acceptance
    cy.get('[data-testid="driver-info"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="driver-name"]').should('contain', 'Driver');
    cy.get('[data-testid="driver-rating"]').should('be.visible');
    cy.get('[data-testid="vehicle-info"]').should('be.visible');

    // Step 3: Wait for driver arrival
    cy.get('[data-testid="ride-status"]', { timeout: 15000 }).should(
      'contain',
      'Driver arriving'
    );
    cy.get('[data-testid="live-tracking-map"]').should('be.visible');
    cy.get('[data-testid="driver-location"]').should('be.visible');

    // Step 4: Driver picks up passenger
    cy.get('[data-testid="ride-status"]', { timeout: 10000 }).should(
      'contain',
      'In progress'
    );
    cy.get('[data-testid="eta-remaining"]').should('be.visible');

    // Step 5: Ride completes
    cy.get('[data-testid="ride-status"]', { timeout: 20000 }).should(
      'contain',
      'Completed'
    );
    cy.get('[data-testid="final-fare"]').should('be.visible');
    cy.get('[data-testid="ride-duration"]').should('be.visible');
    cy.get('[data-testid="ride-distance"]').should('be.visible');

    // Step 6: Payment screen appears
    cy.get('[data-testid="payment-method-selector"]').should('be.visible');
    cy.get('[data-testid="payment-summary"]').should('be.visible');

    // Select payment method (card)
    cy.get('[data-testid="payment-method-card"]').click();
    cy.get('[data-testid="pay-button"]').click();

    // Verify payment processing
    cy.get('[data-testid="payment-status"]', { timeout: 10000 }).should(
      'contain',
      'Processing'
    );

    // Verify payment success
    cy.get('[data-testid="payment-status"]', { timeout: 10000 }).should(
      'contain',
      'Completed'
    );

    // Step 7: Rating screen
    cy.get('[data-testid="rating-modal"]', { timeout: 5000 }).should('be.visible');
    cy.get('[data-testid="rating-title"]').should('contain', 'Rate your driver');

    // Submit rating
    cy.get('[data-testid="star-5"]').click(); // 5 stars
    cy.get('[data-testid="review-text"]').type('Great driver, very professional!');
    cy.get('[data-testid="category-cleanliness-4"]').click();
    cy.get('[data-testid="category-communication-5"]').click();
    cy.get('[data-testid="category-driving-5"]').click();

    cy.get('[data-testid="submit-rating-button"]').click();

    // Verify rating submitted
    cy.get('[data-testid="rating-confirmation"]', { timeout: 5000 }).should(
      'contain',
      'Thank you'
    );

    // Step 8: Return to dashboard
    cy.get('[data-testid="back-to-dashboard-button"]').click();
    cy.get('[data-testid="recent-ride"]').first().should('contain', 'Completed');
  });

  it('should show estimated fare before confirming ride', () => {
    cy.get('[data-testid="request-ride-button"]').click();

    cy.get('[data-testid="pickup-location-input"]')
      .click()
      .type('Times Square, New York');
    cy.get('[data-testid="location-suggestion-0"]').click();

    cy.get('[data-testid="dropoff-location-input"]')
      .click()
      .type('Central Park, New York');
    cy.get('[data-testid="location-suggestion-0"]').click();

    // Verify fare breakdown
    cy.get('[data-testid="fare-breakdown"]').should('be.visible');
    cy.get('[data-testid="fare-base"]').should('contain', '$');
    cy.get('[data-testid="fare-distance"]').should('contain', '$');
    cy.get('[data-testid="fare-duration"]').should('contain', '$');
    cy.get('[data-testid="fare-total"]').should('contain', '$');

    // Check surge pricing indication
    const currentHour = new Date().getHours();
    if ((currentHour >= 8 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19)) {
      cy.get('[data-testid="surge-pricing-badge"]').should('contain', '1.5x');
    }
  });

  it('should allow payment method change before confirming ride', () => {
    cy.get('[data-testid="request-ride-button"]').click();

    cy.get('[data-testid="pickup-location-input"]')
      .click()
      .type('123 Main St, New York');
    cy.get('[data-testid="location-suggestion-0"]').click();

    cy.get('[data-testid="dropoff-location-input"]')
      .click()
      .type('456 Broadway, New York');
    cy.get('[data-testid="location-suggestion-0"]').click();

    // Verify default payment method
    cy.get('[data-testid="selected-payment-method"]').should('be.visible');

    // Change payment method
    cy.get('[data-testid="change-payment-button"]').click();
    cy.get('[data-testid="payment-method-wallet"]').click();
    cy.get('[data-testid="confirm-payment-method"]').click();

    // Verify payment method changed
    cy.get('[data-testid="selected-payment-method"]').should('contain', 'Wallet');
  });

  it('should display driver profile with ratings and badge', () => {
    cy.get('[data-testid="request-ride-button"]').click();

    cy.get('[data-testid="pickup-location-input"]')
      .click()
      .type('123 Main St');
    cy.get('[data-testid="location-suggestion-0"]').click();

    cy.get('[data-testid="dropoff-location-input"]')
      .click()
      .type('456 Broadway');
    cy.get('[data-testid="location-suggestion-0"]').click();

    cy.get('[data-testid="confirm-ride-button"]').click();

    // Wait for driver assignment
    cy.get('[data-testid="driver-card"]', { timeout: 10000 }).should('be.visible');

    // Verify driver information
    cy.get('[data-testid="driver-name"]').should('be.visible');
    cy.get('[data-testid="driver-photo"]').should('be.visible');
    cy.get('[data-testid="driver-rating"]').invoke('text').then((text) => {
      const rating = parseFloat(text);
      expect(rating).to.be.greaterThan(0);
      expect(rating).to.be.lessThanOrEqual(5);
    });

    // Check for driver badges
    cy.get('[data-testid="driver-badge"]').each(($badge) => {
      const badgeText = $badge.text();
      expect(['Super Driver', 'Highly Rated', 'Veteran']).to.include(badgeText);
    });

    // Verify vehicle information
    cy.get('[data-testid="vehicle-make"]').should('be.visible');
    cy.get('[data-testid="vehicle-model"]').should('be.visible');
    cy.get('[data-testid="vehicle-plate"]').should('be.visible');
  });

  it('should handle payment failure and allow retry', () => {
    cy.get('[data-testid="request-ride-button"]').click();

    cy.get('[data-testid="pickup-location-input"]')
      .click()
      .type('123 Main St');
    cy.get('[data-testid="location-suggestion-0"]').click();

    cy.get('[data-testid="dropoff-location-input"]')
      .click()
      .type('456 Broadway');
    cy.get('[data-testid="location-suggestion-0"]').click();

    cy.get('[data-testid="confirm-ride-button"]').click();

    // Wait for ride completion
    cy.get('[data-testid="ride-status"]', { timeout: 30000 }).should(
      'contain',
      'Completed'
    );

    // Payment screen with failure
    cy.get('[data-testid="payment-method-selector"]').should('be.visible');
    cy.get('[data-testid="pay-button"]').click();

    // Simulate payment failure
    cy.get('[data-testid="payment-error"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="payment-error-message"]').should('contain', 'failed');

    // Retry payment
    cy.get('[data-testid="retry-payment-button"]').click();

    // Verify retry works
    cy.get('[data-testid="payment-status"]', { timeout: 10000 }).should(
      'contain',
      'Completed'
    );
  });

  it('should display ride receipt after completion', () => {
    cy.get('[data-testid="request-ride-button"]').click();

    cy.get('[data-testid="pickup-location-input"]')
      .click()
      .type('123 Main St');
    cy.get('[data-testid="location-suggestion-0"]').click();

    cy.get('[data-testid="dropoff-location-input"]')
      .click()
      .type('456 Broadway');
    cy.get('[data-testid="location-suggestion-0"]').click();

    cy.get('[data-testid="confirm-ride-button"]').click();

    // Wait for completion and payment
    cy.get('[data-testid="ride-status"]', { timeout: 30000 }).should(
      'contain',
      'Completed'
    );
    cy.get('[data-testid="payment-status"]', { timeout: 10000 }).should(
      'contain',
      'Completed'
    );
    cy.get('[data-testid="rating-confirmation"]', { timeout: 5000 }).should(
      'be.visible'
    );

    // Go to receipt
    cy.get('[data-testid="back-to-dashboard-button"]').click();
    cy.get('[data-testid="recent-ride"]').first().click();

    // Verify receipt details
    cy.get('[data-testid="receipt-title"]').should('contain', 'Receipt');
    cy.get('[data-testid="receipt-trip-id"]').should('be.visible');
    cy.get('[data-testid="receipt-date"]').should('be.visible');
    cy.get('[data-testid="receipt-distance"]').should('be.visible');
    cy.get('[data-testid="receipt-duration"]').should('be.visible');
    cy.get('[data-testid="receipt-fare-breakdown"]').should('be.visible');
    cy.get('[data-testid="receipt-payment-method"]').should('be.visible');
    cy.get('[data-testid="receipt-total"]').should('be.visible');
  });
});
