/**
 * E2E Tests for Ride Matching Flow
 *
 * Tests the complete ride matching experience:
 * - Request a ride
 * - See driver matching
 * - Driver accepts ride
 * - Ride starts
 * - Real-time tracking
 * - Ride completion
 * - Rating exchange
 */

describe('Ride Matching Flow E2E Tests', () => {
  const passengerEmail = 'passenger@example.com';
  const passengerPassword = 'password123';
  const driverEmail = 'driver@example.com';
  const driverPassword = 'password123';

  const apiUrl = 'http://localhost:3000/api';

  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Request a Ride', () => {
    beforeEach(() => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(passengerEmail);
      cy.get('input[name="password"]').type(passengerPassword);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });

    it('should display ride request form', () => {
      cy.get('[data-testid="request-ride-button"]').click();
      cy.get('[data-testid="ride-request-form"]').should('be.visible');
      cy.get('[data-testid="pickup-input"]').should('be.visible');
      cy.get('[data-testid="dropoff-input"]').should('be.visible');
      cy.get('[data-testid="service-type-select"]').should('be.visible');
    });

    it('should search for pickup location', () => {
      cy.get('[data-testid="request-ride-button"]').click();
      cy.get('[data-testid="pickup-input"]').type('Central Station');

      // Should show autocomplete suggestions
      cy.get('[data-testid="suggestion-item"]').should(
        'have.length.greaterThan',
        0
      );
      cy.get('[data-testid="suggestion-item"]').first().click();

      cy.get('[data-testid="pickup-input"]').should(
        'have.value',
        /Central Station/
      );
    });

    it('should search for dropoff location', () => {
      cy.get('[data-testid="request-ride-button"]').click();
      cy.get('[data-testid="pickup-input"]').type('Central Station');
      cy.get('[data-testid="suggestion-item"]').first().click();

      cy.get('[data-testid="dropoff-input"]').type('Airport');

      // Should show autocomplete suggestions
      cy.get('[data-testid="suggestion-item"]').should(
        'have.length.greaterThan',
        0
      );
      cy.get('[data-testid="suggestion-item"]').first().click();

      cy.get('[data-testid="dropoff-input"]').should('have.value', /Airport/);
    });

    it('should select different service types', () => {
      cy.get('[data-testid="request-ride-button"]').click();
      cy.get('[data-testid="pickup-input"]').type('Central Station');
      cy.get('[data-testid="suggestion-item"]').first().click();
      cy.get('[data-testid="dropoff-input"]').type('Airport');
      cy.get('[data-testid="suggestion-item"]').first().click();

      // Select premium service
      cy.get('[data-testid="service-type-select"]').click();
      cy.get('[data-testid="service-premium"]').click();

      // Should show premium price
      cy.get('[data-testid="estimated-fare"]').should('contain', '$');
    });

    it('should show estimated fare and time', () => {
      cy.get('[data-testid="request-ride-button"]').click();
      cy.get('[data-testid="pickup-input"]').type('Central Station');
      cy.get('[data-testid="suggestion-item"]').first().click();
      cy.get('[data-testid="dropoff-input"]').type('Airport');
      cy.get('[data-testid="suggestion-item"]').first().click();

      cy.get('[data-testid="estimated-fare"]').should('be.visible');
      cy.get('[data-testid="estimated-time"]').should('be.visible');
      cy.get('[data-testid="estimated-distance"]').should('be.visible');
    });

    it('should request a ride successfully', () => {
      cy.get('[data-testid="request-ride-button"]').click();
      cy.get('[data-testid="pickup-input"]').type('Central Station');
      cy.get('[data-testid="suggestion-item"]').first().click();
      cy.get('[data-testid="dropoff-input"]').type('Airport');
      cy.get('[data-testid="suggestion-item"]').first().click();

      cy.get('[data-testid="confirm-ride-button"]').click();

      // Should show matching screen
      cy.get('[data-testid="matching-screen"]', { timeout: 5000 }).should(
        'be.visible'
      );
      cy.get('[data-testid="matching-spinner"]').should('be.visible');
      cy.get('[data-testid="cancellation-timer"]').should('be.visible');
    });

    it('should show matching progress', () => {
      cy.get('[data-testid="request-ride-button"]').click();
      cy.get('[data-testid="pickup-input"]').type('Central Station');
      cy.get('[data-testid="suggestion-item"]').first().click();
      cy.get('[data-testid="dropoff-input"]').type('Airport');
      cy.get('[data-testid="suggestion-item"]').first().click();

      cy.get('[data-testid="confirm-ride-button"]').click();

      // Should show available drivers
      cy.get('[data-testid="available-drivers"]', { timeout: 5000 }).should(
        'be.visible'
      );
      cy.get('[data-testid="driver-count"]').should('contain', /\d+ drivers/);
    });
  });

  describe('Driver Accepts Ride', () => {
    it('should show driver matching on driver app', () => {
      // Login as driver
      cy.visit('/driver/login');
      cy.get('input[name="email"]').type(driverEmail);
      cy.get('input[name="password"]').type(driverPassword);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/driver/dashboard');

      // Turn on driver mode
      cy.get('[data-testid="go-online-button"]').click();

      // Wait for ride offer
      cy.get('[data-testid="ride-offer"]', { timeout: 10000 }).should(
        'be.visible'
      );
      cy.get('[data-testid="passenger-name"]').should('be.visible');
      cy.get('[data-testid="pickup-address"]').should('be.visible');
      cy.get('[data-testid="dropoff-address"]').should('be.visible');
      cy.get('[data-testid="estimated-fare"]').should('be.visible');
    });

    it('should show countdown timer on ride offer', () => {
      cy.visit('/driver/login');
      cy.get('input[name="email"]').type(driverEmail);
      cy.get('input[name="password"]').type(driverPassword);
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="go-online-button"]').click();

      cy.get('[data-testid="ride-offer"]', { timeout: 10000 }).should(
        'be.visible'
      );
      cy.get('[data-testid="offer-countdown"]').should('be.visible');
    });

    it('should accept ride with accept button', () => {
      cy.visit('/driver/login');
      cy.get('input[name="email"]').type(driverEmail);
      cy.get('input[name="password"]').type(driverPassword);
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="go-online-button"]').click();

      cy.get('[data-testid="ride-offer"]', { timeout: 10000 }).should(
        'be.visible'
      );
      cy.get('[data-testid="accept-ride-button"]').click();

      // Should show ride accepted screen
      cy.get('[data-testid="ride-accepted"]', { timeout: 5000 }).should(
        'be.visible'
      );
      cy.get('[data-testid="navigation-map"]').should('be.visible');
    });

    it('should reject ride with decline button', () => {
      cy.visit('/driver/login');
      cy.get('input[name="email"]').type(driverEmail);
      cy.get('input[name="password"]').type(driverPassword);
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="go-online-button"]').click();

      cy.get('[data-testid="ride-offer"]', { timeout: 10000 }).should(
        'be.visible'
      );
      cy.get('[data-testid="decline-ride-button"]').click();

      // Should show next ride offer or empty state
      cy.get('[data-testid="ride-offer"]').should('not.exist');
    });
  });

  describe('Real-time Driver Tracking', () => {
    beforeEach(() => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(passengerEmail);
      cy.get('input[name="password"]').type(passengerPassword);
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');

      // Request a ride and wait for driver acceptance
      cy.get('[data-testid="request-ride-button"]').click();
      cy.get('[data-testid="pickup-input"]').type('Central Station');
      cy.get('[data-testid="suggestion-item"]').first().click();
      cy.get('[data-testid="dropoff-input"]').type('Airport');
      cy.get('[data-testid="suggestion-item"]').first().click();
      cy.get('[data-testid="confirm-ride-button"]').click();

      // Wait for driver acceptance
      cy.get('[data-testid="driver-accepted"]', { timeout: 10000 }).should(
        'be.visible'
      );
    });

    it('should show driver location on map', () => {
      cy.get('[data-testid="tracking-map"]').should('be.visible');
      cy.get('[data-testid="driver-marker"]').should('be.visible');
      cy.get('[data-testid="pickup-marker"]').should('be.visible');
      cy.get('[data-testid="dropoff-marker"]').should('be.visible');
    });

    it('should show real-time driver info', () => {
      cy.get('[data-testid="driver-info"]').should('be.visible');
      cy.get('[data-testid="driver-name"]').should('be.visible');
      cy.get('[data-testid="driver-rating"]').should('be.visible');
      cy.get('[data-testid="vehicle-info"]').should('be.visible');
      cy.get('[data-testid="driver-phone"]').should('be.visible');
    });

    it('should show ETA to pickup', () => {
      cy.get('[data-testid="driver-eta"]').should('be.visible');
      cy.get('[data-testid="driver-eta"]').should('match', /\d+\s*min/);
    });

    it('should show distance to pickup', () => {
      cy.get('[data-testid="driver-distance"]').should('be.visible');
      cy.get('[data-testid="driver-distance"]').should(
        'match',
        /\d+\.?\d*\s*km/
      );
    });

    it('should update driver location in real-time', () => {
      cy.get('[data-testid="driver-distance"]').then(($el) => {
        const initialDistance = $el.text();

        // Wait for location update
        cy.wait(5000);

        cy.get('[data-testid="driver-distance"]').then(($updated) => {
          // Distance should change
          expect($updated.text()).not.to.equal(initialDistance);
        });
      });
    });

    it('should allow sharing ride with another passenger', () => {
      cy.get('[data-testid="share-ride-button"]').should('be.visible');
      cy.get('[data-testid="share-ride-button"]').click();

      cy.get('[data-testid="share-modal"]').should('be.visible');
      cy.get('[data-testid="share-link"]').should('be.visible');
    });
  });

  describe('Ride Start and Progress', () => {
    beforeEach(() => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(passengerEmail);
      cy.get('input[name="password"]').type(passengerPassword);
      cy.get('button[type="submit"]').click();

      cy.get('[data-testid="request-ride-button"]').click();
      cy.get('[data-testid="pickup-input"]').type('Central Station');
      cy.get('[data-testid="suggestion-item"]').first().click();
      cy.get('[data-testid="dropoff-input"]').type('Airport');
      cy.get('[data-testid="suggestion-item"]').first().click();
      cy.get('[data-testid="confirm-ride-button"]').click();

      cy.get('[data-testid="driver-accepted"]', { timeout: 10000 }).should(
        'be.visible'
      );
    });

    it('should show driver arrival notification', () => {
      cy.get('[data-testid="driver-arrived"]', { timeout: 30000 }).should(
        'be.visible'
      );
      cy.get('[data-testid="driver-arrived-notification"]').should(
        'be.visible'
      );
    });

    it('should confirm pickup', () => {
      cy.get('[data-testid="driver-arrived"]', { timeout: 30000 }).should(
        'be.visible'
      );
      cy.get('[data-testid="confirm-pickup-button"]').click();

      // Should start the ride
      cy.get('[data-testid="ride-in-progress"]', { timeout: 5000 }).should(
        'be.visible'
      );
    });

    it('should show ride timer', () => {
      cy.get('[data-testid="driver-arrived"]', { timeout: 30000 }).should(
        'be.visible'
      );
      cy.get('[data-testid="confirm-pickup-button"]').click();

      cy.get('[data-testid="ride-timer"]').should('be.visible');
      cy.get('[data-testid="ride-timer"]').should('match', /\d+:\d+/);
    });

    it('should show live route on map', () => {
      cy.get('[data-testid="driver-arrived"]', { timeout: 30000 }).should(
        'be.visible'
      );
      cy.get('[data-testid="confirm-pickup-button"]').click();

      cy.get('[data-testid="tracking-map"]').should('be.visible');
      cy.get('[data-testid="active-route"]').should('be.visible');
    });

    it('should display current fare and trip details', () => {
      cy.get('[data-testid="driver-arrived"]', { timeout: 30000 }).should(
        'be.visible'
      );
      cy.get('[data-testid="confirm-pickup-button"]').click();

      cy.get('[data-testid="current-fare"]').should('be.visible');
      cy.get('[data-testid="trip-distance"]').should('be.visible');
      cy.get('[data-testid="trip-duration"]').should('be.visible');
    });
  });

  describe('Ride Completion and Payment', () => {
    it('should show completion screen when ride ends', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(passengerEmail);
      cy.get('input[name="password"]').type(passengerPassword);
      cy.get('button[type="submit"]').click();

      // Request ride (simulated to be already in progress)
      cy.visit('/rides/ride_in_progress');

      cy.get('[data-testid="ride-completion"]', { timeout: 60000 }).should(
        'be.visible'
      );
      cy.get('[data-testid="final-fare"]').should('be.visible');
      cy.get('[data-testid="trip-summary"]').should('be.visible');
    });

    it('should show fare breakdown', () => {
      cy.visit('/rides/ride_completed');

      cy.get('[data-testid="fare-breakdown"]').should('be.visible');
      cy.get('[data-testid="base-fare"]').should('be.visible');
      cy.get('[data-testid="distance-fare"]').should('be.visible');
      cy.get('[data-testid="time-fare"]').should('be.visible');
      cy.get('[data-testid="total-fare"]').should('be.visible');
    });

    it('should allow payment method selection', () => {
      cy.visit('/rides/ride_completed');

      cy.get('[data-testid="payment-methods"]').should('be.visible');
      cy.get('[data-testid="payment-method-item"]').should(
        'have.length.greaterThan',
        0
      );
      cy.get('[data-testid="payment-method-item"]').first().click();
      cy.get('[data-testid="payment-method-item"]')
        .first()
        .should('have.class', 'selected');
    });

    it('should process payment', () => {
      cy.visit('/rides/ride_completed');

      cy.get('[data-testid="payment-method-item"]').first().click();
      cy.get('[data-testid="pay-button"]').click();

      cy.get('[data-testid="payment-processing"]').should('be.visible');
      cy.get('[data-testid="payment-success"]', { timeout: 5000 }).should(
        'be.visible'
      );
    });
  });

  describe('Ride Rating and Feedback', () => {
    it('should show rating screen after ride completion', () => {
      cy.visit('/rides/ride_completed');

      cy.get('[data-testid="rating-screen"]').should('be.visible');
      cy.get('[data-testid="driver-rating-prompt"]').should('be.visible');
    });

    it('should allow rating driver', () => {
      cy.visit('/rides/ride_completed');

      cy.get('[data-testid="star-rating-4"]').click();
      cy.get('[data-testid="star-rating-4"]').should('have.class', 'selected');

      cy.get('[data-testid="feedback-input"]').type('Great driver!');
      cy.get('[data-testid="submit-rating-button"]').click();

      cy.get('[data-testid="rating-submitted"]', { timeout: 5000 }).should(
        'be.visible'
      );
    });

    it('should show rating confirmation', () => {
      cy.visit('/rides/ride_completed');

      cy.get('[data-testid="star-rating-5"]').click();
      cy.get('[data-testid="submit-rating-button"]').click();

      cy.get('[data-testid="rating-confirmed"]', { timeout: 5000 }).should(
        'be.visible'
      );
      cy.get('[data-testid="thank-you-message"]').should('be.visible');
    });
  });

  describe('Ride Cancellation', () => {
    it('should allow passenger to cancel requested ride', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(passengerEmail);
      cy.get('input[name="password"]').type(passengerPassword);
      cy.get('button[type="submit"]').click();

      cy.get('[data-testid="request-ride-button"]').click();
      cy.get('[data-testid="pickup-input"]').type('Central Station');
      cy.get('[data-testid="suggestion-item"]').first().click();
      cy.get('[data-testid="dropoff-input"]').type('Airport');
      cy.get('[data-testid="suggestion-item"]').first().click();
      cy.get('[data-testid="confirm-ride-button"]').click();

      cy.get('[data-testid="cancel-ride-button"]').click();
      cy.get('[data-testid="cancel-confirmation-modal"]').should('be.visible');
    });

    it('should show cancellation reason options', () => {
      cy.visit('/rides/ride_requested');

      cy.get('[data-testid="cancel-ride-button"]').click();
      cy.get('[data-testid="cancel-reason-item"]').should(
        'have.length.greaterThan',
        0
      );
    });

    it('should confirm cancellation', () => {
      cy.visit('/rides/ride_requested');

      cy.get('[data-testid="cancel-ride-button"]').click();
      cy.get('[data-testid="cancel-reason-item"]').first().click();
      cy.get('[data-testid="confirm-cancel-button"]').click();

      cy.get('[data-testid="ride-cancelled"]', { timeout: 5000 }).should(
        'be.visible'
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle ride request errors gracefully', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(passengerEmail);
      cy.get('input[name="password"]').type(passengerPassword);
      cy.get('button[type="submit"]').click();

      cy.intercept('POST', '**/rides/request', { statusCode: 500 }).as(
        'requestError'
      );

      cy.get('[data-testid="request-ride-button"]').click();
      cy.get('[data-testid="pickup-input"]').type('Central Station');
      cy.get('[data-testid="suggestion-item"]').first().click();
      cy.get('[data-testid="dropoff-input"]').type('Airport');
      cy.get('[data-testid="suggestion-item"]').first().click();
      cy.get('[data-testid="confirm-ride-button"]').click();

      cy.wait('@requestError');
      cy.get('[data-testid="error-message"]').should('be.visible');
    });

    it('should handle network disconnection gracefully', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(passengerEmail);
      cy.get('input[name="password"]').type(passengerPassword);
      cy.get('button[type="submit"]').click();

      cy.get('[data-testid="request-ride-button"]').click();
      cy.get('[data-testid="pickup-input"]').type('Central Station');
      cy.get('[data-testid="suggestion-item"]').first().click();
      cy.get('[data-testid="dropoff-input"]').type('Airport');
      cy.get('[data-testid="suggestion-item"]').first().click();
      cy.get('[data-testid="confirm-ride-button"]').click();

      // Simulate network disconnect
      cy.intercept('GET', '**', (req) => {
        req.destroy();
      });

      cy.get('[data-testid="connection-error"]', { timeout: 10000 }).should(
        'be.visible'
      );
    });
  });
});
