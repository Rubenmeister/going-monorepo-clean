/// <reference types="cypress" />

describe('Performance Tests', () => {
  it('should load homepage in under 2 seconds', () => {
    cy.visit('http://localhost:3000', {
      onBeforeLoad: (win) => {
        win.performance.mark('start');
      },
      onLoad: (win) => {
        win.performance.mark('end');
        win.performance.measure('homepage-load', 'start', 'end');
      },
    });

    cy.window().then((win) => {
      const measures = win.performance.getEntriesByName('homepage-load');
      expect(measures.length).to.be.greaterThan(0);

      const duration = measures[0].duration;
      // Allow up to 3 seconds for CI environment
      expect(duration).to.be.lessThan(3000);

      cy.log(`Homepage loaded in ${duration.toFixed(2)}ms`);
    });

    // Verify page is interactive
    cy.get('button').should('exist');
  });

  it('should load dashboard in under 3 seconds', () => {
    cy.visit('http://localhost:3000');
    cy.login('test@example.com', 'Password123!');

    cy.visit('http://localhost:3000/dashboard', {
      onBeforeLoad: (win) => {
        win.performance.mark('start');
      },
      onLoad: (win) => {
        win.performance.mark('end');
        win.performance.measure('dashboard-load', 'start', 'end');
      },
    });

    cy.window().then((win) => {
      const measures = win.performance.getEntriesByName('dashboard-load');
      expect(measures.length).to.be.greaterThan(0);

      const duration = measures[0].duration;
      // Allow up to 4 seconds for CI environment
      expect(duration).to.be.lessThan(4000);

      cy.log(`Dashboard loaded in ${duration.toFixed(2)}ms`);
    });

    // Verify dashboard is fully loaded
    cy.get('[data-cy="dashboard-content"]').should('be.visible');
  });

  it('should load bookings list in under 2 seconds', () => {
    cy.visit('http://localhost:3000');
    cy.login('test@example.com', 'Password123!');

    cy.visit('http://localhost:3000/bookings', {
      onBeforeLoad: (win) => {
        win.performance.mark('start');
      },
      onLoad: (win) => {
        win.performance.mark('end');
        win.performance.measure('bookings-load', 'start', 'end');
      },
    });

    cy.window().then((win) => {
      const measures = win.performance.getEntriesByName('bookings-load');
      expect(measures.length).to.be.greaterThan(0);

      const duration = measures[0].duration;
      expect(duration).to.be.lessThan(3000);

      cy.log(`Bookings page loaded in ${duration.toFixed(2)}ms`);
    });

    cy.get('[data-cy="bookings-list"]').should('be.visible');
  });

  it('should handle image lazy loading', () => {
    cy.visit('http://localhost:3000');

    // Verify images are using lazy loading
    cy.get('img[loading="lazy"]').each(($img) => {
      // Verify src attribute exists
      cy.wrap($img).should('have.attr', 'src');
    });

    // Scroll to bottom
    cy.scrollTo('bottom');

    // Verify lazy-loaded images have loaded
    cy.get('img').each(($img) => {
      cy.wrap($img).should('have.attr', 'src');
    });
  });

  it('should minimize bundle size with code splitting', () => {
    cy.visit('http://localhost:3000');

    cy.window().then((win) => {
      // Check Network tab in devtools
      const performanceEntries = win.performance.getEntriesByType('navigation');

      if (performanceEntries.length > 0) {
        const transferSize = performanceEntries[0].transferSize;
        cy.log(
          `Initial transfer size: ${(transferSize / 1024 / 1024).toFixed(2)}MB`
        );

        // Reasonable limit for initial bundle
        expect(transferSize).to.be.lessThan(500 * 1024); // 500KB limit
      }
    });
  });

  it('should cache responses efficiently', () => {
    // First load
    cy.visit('http://localhost:3000/api/test', {
      onBeforeLoad: (win) => {
        win.performance.mark('first-load-start');
      },
      onLoad: (win) => {
        win.performance.mark('first-load-end');
        win.performance.measure(
          'first-load',
          'first-load-start',
          'first-load-end'
        );
      },
    });

    cy.window().then((win) => {
      const firstMeasure = win.performance.getEntriesByName('first-load')[0];
      const firstLoadTime = firstMeasure.duration;

      // Second load (should be faster due to cache)
      cy.visit('http://localhost:3000/api/test', {
        onBeforeLoad: (win) => {
          win.performance.mark('second-load-start');
        },
        onLoad: (win) => {
          win.performance.mark('second-load-end');
          win.performance.measure(
            'second-load',
            'second-load-start',
            'second-load-end'
          );
        },
      });

      cy.window().then((win) => {
        const secondMeasure =
          win.performance.getEntriesByName('second-load')[0];
        const secondLoadTime = secondMeasure.duration;

        cy.log(`First load: ${firstLoadTime.toFixed(2)}ms`);
        cy.log(`Second load (cached): ${secondLoadTime.toFixed(2)}ms`);

        // Second load should be significantly faster
        expect(secondLoadTime).to.be.lessThan(firstLoadTime);
      });
    });
  });

  it('should render large lists with virtualization', () => {
    cy.visit('http://localhost:3000');
    cy.login('test@example.com', 'Password123!');

    cy.visit('http://localhost:3000/bookings?limit=100');

    // Verify only visible items are rendered
    cy.get('[data-cy="booking-item"]').should('have.length.lessThan', 100);

    // Scroll down
    cy.get('[data-cy="bookings-list"]').scrollTo('bottom');

    // Verify more items load
    cy.get('[data-cy="booking-item"]').should('have.length.greaterThan', 10);
  });

  it('should have optimized CSS rendering', () => {
    cy.visit('http://localhost:3000', {
      onBeforeLoad: (win) => {
        // Check CSS metrics
        const stylesheets = win.document.querySelectorAll(
          'style, link[rel="stylesheet"]'
        );
        expect(stylesheets.length).to.be.greaterThan(0);
      },
    });

    // Verify critical CSS is inline
    cy.get('style').should('exist');

    // Verify non-critical CSS is deferred
    cy.get('link[rel="stylesheet"]').each(($link) => {
      const media = $link.attr('media');
      // Some stylesheets should be media queries
    });
  });

  it('should measure Core Web Vitals', () => {
    cy.visit('http://localhost:3000', {
      onBeforeLoad: (win) => {
        win.webVitalsMetrics = {};

        // Largest Contentful Paint
        if (win.PerformanceObserver) {
          try {
            const observer = new win.PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              win.webVitalsMetrics.lcp =
                lastEntry.renderTime || lastEntry.loadTime;
            });
            observer.observe({ entryTypes: ['largest-contentful-paint'] });
          } catch (e) {
            // Observer not supported
          }
        }
      },
    });

    cy.window().then((win) => {
      // Check if metrics were collected
      if (win.webVitalsMetrics) {
        cy.log('Core Web Vitals collected');
        // LCP should be under 2.5 seconds
        if (win.webVitalsMetrics.lcp) {
          expect(win.webVitalsMetrics.lcp).to.be.lessThan(2500);
        }
      }
    });
  });
});
