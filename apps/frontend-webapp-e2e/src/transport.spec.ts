import { test, expect } from '@playwright/test';

test.describe('Transport Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Debug console
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err));

    // Conditional Network Mocking
    // If TEST_ENV is 'ci' (or 'real'), we do NOT abort requests or mock APIs,
    // allowing the test to hit the real backend at localhost:3000.
    if (process.env.TEST_ENV !== 'ci') {
      console.log('MOCK MODE: Configuring network mocks...');

      // Disable Service Worker to ensure network mocking works
      await page.route('**/manifest.webmanifest', route => route.abort());
      await page.route('**/sw.js', route => route.abort());
      await page.route('**/registerSW.js', route => route.abort());

      // Mock API responses
      await page.route(/.*\/api\/transports/, async route => {
        console.log('MOCK: Intercepted /api/transports call');
        const json = [{
          id: 'trip-e2e-1',
          driverId: 'driver-1',
          vehicleType: 'SUV',
          mode: 'RIDE',
          status: 'published', // Matched to ActivityItem type
          originCity: 'Quito',
          originAddress: 'La Mariscal',
          destCity: 'Cumbaya',
          destAddress: 'Reservorio',
          departureTime: new Date().toISOString(),
          estimatedArrivalTime: new Date().toISOString(),
          pricePerKm: 1.5,
          pricePerPassenger: 12.00,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          passengers: []
        }];
        await route.fulfill({ json });
      });

      // Mock Experiences to be empty to isolate transport check
      await page.route(/.*\/api\/experiences\/experiences/, async route => {
          await route.fulfill({ json: [] });
      });
      
      // Mock Parcels & Accommodations empty for now in mock mode
      await page.route(/.*\/api\/parcels.*/, async route => route.fulfill({ json: [] }));
      await page.route(/.*\/api\/hosts.*/, async route => route.fulfill({ json: [] }));
    } else {
      console.log('REAL DB MODE: Skipping network mocks, hitting real backend...');
    }

    // Mock authentication reliably before any navigation
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'test@going.com',
        name: 'Test User',
        role: 'super_admin'
      }));
    });

    // Initial navigation
    await page.goto('/');
  });

  test('should display the transport list with rides', async ({ page }) => {
    // Navigate to Customer Trips which renders ActivityList
    await page.goto('/c/trips');

    // Verify header
    await expect(page.locator('h1')).toContainText('Actividad');

    // Filters have been removed from UI for now, so we skip selection
    // const typeFilter = page.locator('select').first();
    // await typeFilter.selectOption('ride');

    // Verify list items - wait for specific content to appear (implicit wait)
    await expect(page.getByText('La Mariscal')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Reservorio')).toBeVisible();
    await expect(page.getByText('Reservorio')).toBeVisible();
  });
});
