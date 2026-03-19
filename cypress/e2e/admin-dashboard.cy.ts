describe('Admin Dashboard - Analytics and Monitoring', () => {
  beforeEach(() => {
    // Login as admin
    cy.visit('http://localhost:3001/admin');
    cy.get('[data-testid="login-email"]').type('admin@test.com');
    cy.get('[data-testid="login-password"]').type('admin123');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/admin/dashboard');
  });

  it('should display real-time dashboard metrics', () => {
    // Dashboard should be visible
    cy.get('[data-testid="dashboard-title"]').should('contain', 'Dashboard');

    // Real-time metrics section
    cy.get('[data-testid="real-time-section"]').should('be.visible');

    // Key metrics
    cy.get('[data-testid="active-riders"]').should('be.visible');
    cy.get('[data-testid="active-drivers"]').should('be.visible');
    cy.get('[data-testid="rides-in-progress"]').should('be.visible');
    cy.get('[data-testid="completed-today"]').should('be.visible');

    // Revenue metrics
    cy.get('[data-testid="revenue-today"]').should('be.visible');
    cy.get('[data-testid="revenue-week"]').should('be.visible');
    cy.get('[data-testid="revenue-month"]').should('be.visible');

    // Ensure numbers are displayed
    cy.get('[data-testid="active-riders"]')
      .invoke('text')
      .then((text) => {
        expect(parseInt(text)).to.be.greaterThanOrEqual(0);
      });
  });

  it('should display rides analytics chart', () => {
    cy.get('[data-testid="analytics-section"]').should('be.visible');

    // Chart should be visible
    cy.get('[data-testid="rides-chart"]').should('be.visible');

    // Chart controls
    cy.get('[data-testid="chart-period-selector"]').should('be.visible');

    // Test different time periods
    const periods = ['today', 'week', 'month'];

    periods.forEach((period) => {
      cy.get(`[data-testid="period-${period}"]`).click();
      cy.get('[data-testid="rides-chart"]').should('be.visible');
      cy.get('[data-testid="chart-data"]').should('exist');
    });
  });

  it('should display revenue breakdown by payment method', () => {
    cy.get('[data-testid="revenue-breakdown-section"]').should('be.visible');

    // Payment method breakdown
    cy.get('[data-testid="card-revenue"]').should('be.visible');
    cy.get('[data-testid="wallet-revenue"]').should('be.visible');
    cy.get('[data-testid="cash-revenue"]').should('be.visible');

    // Verify percentages add up to 100%
    let totalPercentage = 0;
    cy.get('[data-testid="payment-percentage"]').each(($el) => {
      const percentage = parseFloat($el.text());
      totalPercentage += percentage;
    });

    expect(totalPercentage).to.equal(100);
  });

  it('should display driver performance metrics', () => {
    cy.get('[data-testid="driver-metrics-section"]').should('be.visible');

    // Top drivers
    cy.get('[data-testid="top-drivers-table"]').should('be.visible');
    cy.get('[data-testid="top-drivers-table"]').within(() => {
      cy.get('tbody tr').should('have.length.greaterThan', 0);
      cy.get('tbody tr').first().within(() => {
        cy.get('td').eq(0).should('contain', 'Driver');
        cy.get('td').eq(1).invoke('text').then((text) => {
          const rides = parseInt(text);
          expect(rides).to.be.greaterThanOrEqual(0);
        });
        cy.get('td').eq(2).invoke('text').then((text) => {
          const rating = parseFloat(text);
          expect(rating).to.be.greaterThanOrEqual(0);
          expect(rating).to.be.lessThanOrEqual(5);
        });
      });
    });
  });

  it('should display passenger analytics', () => {
    cy.get('[data-testid="passenger-metrics-section"]').should('be.visible');

    // Passenger statistics
    cy.get('[data-testid="total-passengers"]').should('be.visible');
    cy.get('[data-testid="new-passengers-week"]').should('be.visible');
    cy.get('[data-testid="repeat-passenger-rate"]').should('be.visible');
    cy.get('[data-testid="average-rating-given"]').should('be.visible');
  });

  it('should manage surge pricing settings', () => {
    cy.get('[data-testid="settings-menu"]').click();
    cy.get('[data-testid="surge-pricing-option"]').click();

    // Surge pricing page
    cy.get('[data-testid="surge-pricing-title"]').should('contain', 'Surge Pricing');

    // Display peak hours
    cy.get('[data-testid="peak-hours-list"]').should('be.visible');
    cy.get('[data-testid="peak-hour-item"]').should('have.length', 2); // 8-9am, 5-7pm

    // Test surge multiplier input
    cy.get('[data-testid="peak-hour-0"]').within(() => {
      cy.get('[data-testid="surge-multiplier-input"]')
        .invoke('val')
        .then((val) => {
          expect(parseFloat(val)).to.equal(1.5);
        });
    });

    // Modify surge pricing
    cy.get('[data-testid="peak-hour-0"]').within(() => {
      cy.get('[data-testid="surge-multiplier-input"]').clear().type('1.8');
    });

    cy.get('[data-testid="save-settings-button"]').click();
    cy.get('[data-testid="save-confirmation"]').should('contain', 'saved');
  });

  it('should view and manage transaction logs', () => {
    cy.get('[data-testid="transactions-menu"]').click();
    cy.get('[data-testid="transactions-page"]').should('be.visible');

    // Transaction table
    cy.get('[data-testid="transactions-table"]').should('be.visible');
    cy.get('[data-testid="transaction-row"]').should('have.length.greaterThan', 0);

    // Verify transaction details
    cy.get('[data-testid="transaction-row"]').first().within(() => {
      cy.get('[data-testid="transaction-id"]').should('be.visible');
      cy.get('[data-testid="transaction-amount"]').invoke('text').then((text) => {
        const amount = parseFloat(text.replace('$', ''));
        expect(amount).to.be.greaterThan(0);
      });
      cy.get('[data-testid="transaction-status"]').should('be.visible');
    });

    // Filter by status
    cy.get('[data-testid="status-filter"]').click();
    cy.get('[data-testid="filter-completed"]').click();
    cy.get('[data-testid="transaction-row"]').each(($row) => {
      cy.wrap($row).get('[data-testid="transaction-status"]').should('contain', 'Completed');
    });
  });

  it('should display driver payout reports', () => {
    cy.get('[data-testid="payouts-menu"]').click();
    cy.get('[data-testid="payouts-page"]').should('be.visible');

    // Payout table
    cy.get('[data-testid="payouts-table"]').should('be.visible');
    cy.get('[data-testid="payout-row"]').should('have.length.greaterThan', 0);

    // Verify payout details
    cy.get('[data-testid="payout-row"]').first().within(() => {
      cy.get('[data-testid="driver-name"]').should('be.visible');
      cy.get('[data-testid="payout-amount"]').invoke('text').then((text) => {
        const amount = parseFloat(text.replace('$', ''));
        expect(amount).to.be.greaterThan(0);
      });
      cy.get('[data-testid="payout-status"]').should('be.visible');
      cy.get('[data-testid="payout-date"]').should('be.visible');
    });

    // Test payout status filter
    cy.get('[data-testid="payout-status-filter"]').click();
    cy.get('[data-testid="filter-pending"]').click();
    cy.get('[data-testid="payout-row"]').each(($row) => {
      cy.wrap($row).get('[data-testid="payout-status"]').should('contain', 'Pending');
    });
  });

  it('should generate export reports', () => {
    cy.get('[data-testid="reports-menu"]').click();
    cy.get('[data-testid="reports-page"]').should('be.visible');

    // Report options
    cy.get('[data-testid="daily-report-button"]').click();
    cy.get('[data-testid="report-format-selector"]').should('be.visible');

    // Select CSV format
    cy.get('[data-testid="format-csv"]').click();
    cy.get('[data-testid="generate-report-button"]').click();

    // Verify download
    cy.on('window:before:unload', () => {
      cy.get('[data-testid="download-notification"]').should('be.visible');
    });
  });

  it('should monitor system health', () => {
    cy.get('[data-testid="system-health-menu"]').click();
    cy.get('[data-testid="health-page"]').should('be.visible');

    // Service status
    cy.get('[data-testid="service-status"]').should('be.visible');
    cy.get('[data-testid="service-item"]').each(($item) => {
      cy.wrap($item).get('[data-testid="status-indicator"]').should('have.class', 'success');
    });

    // Database status
    cy.get('[data-testid="database-status"]').should('be.visible');
    cy.get('[data-testid="db-response-time"]').should('be.visible');

    // API latency
    cy.get('[data-testid="api-latency"]').should('be.visible');
    cy.get('[data-testid="latency-value"]')
      .invoke('text')
      .then((text) => {
        const latency = parseInt(text);
        expect(latency).to.be.lessThan(1000); // Should be less than 1 second
      });
  });

  it('should search and filter rides', () => {
    cy.get('[data-testid="rides-menu"]').click();
    cy.get('[data-testid="rides-page"]').should('be.visible');

    // Search by trip ID
    cy.get('[data-testid="search-input"]').type('trip-123');
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="ride-row"]').each(($row) => {
      cy.wrap($row).should('contain', 'trip-123');
    });

    // Clear and search by passenger email
    cy.get('[data-testid="search-input"]').clear().type('passenger@test.com');
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="ride-row"]').each(($row) => {
      cy.wrap($row).should('contain', 'passenger@test.com');
    });

    // Filter by status
    cy.get('[data-testid="status-filter"]').click();
    cy.get('[data-testid="filter-completed"]').click();
    cy.get('[data-testid="ride-row"]').each(($row) => {
      cy.wrap($row).should('contain', 'Completed');
    });
  });

  it('should handle admin notifications', () => {
    // Check notification bell
    cy.get('[data-testid="notification-bell"]').should('be.visible');

    // Click to see notifications
    cy.get('[data-testid="notification-bell"]').click();
    cy.get('[data-testid="notifications-dropdown"]').should('be.visible');

    // Verify notification types
    cy.get('[data-testid="notification-item"]').each(($notification) => {
      cy.wrap($notification).should('contain.one.of', [
        'High demand detected',
        'Payment failed',
        'System alert',
        'New driver registration',
      ]);
    });
  });
});
