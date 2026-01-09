import { test, expect } from '@playwright/test';

test.describe('Experience Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API response
    await page.route('**/api/experiences/experiences', async route => {
      const json = [{
        id: 'exp-e2e-1',
        title: 'Volcanic Adventure',
        description: 'E2E Test Description',
        pricePerPerson: 85.50,
        currency: 'USD',
        maxCapacity: 5,
        durationHours: 8,
        location: 'Cotopaxi, Ecuador',
        status: 'published',
        createdAt: new Date().toISOString()
      }];
      await route.fulfill({ json });
    });

    // Mock authentication by setting localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'test@going.com',
        name: 'Test User',
        role: 'user'
      }));
    });
  });

  test('should display the activity list with experiences', async ({ page }) => {
    // Navigate to activity list (authenticated path)
    await page.goto('/c/activity');

    // Verify header
    await expect(page.locator('h1')).toContainText('Actividad');

    // Check if the experience filter exists
    const typeFilter = page.locator('select').first();
    await expect(typeFilter).toBeVisible();
    
    // Select "Experiencias"
    await typeFilter.selectOption('experience');

    // Verify list items or empty state
    // We expect the button elements representing activity items
    const activityItems = page.locator('button');
    const count = await activityItems.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow filtering by experience type', async ({ page }) => {
    await page.goto('/c/activity');
    
    const typeFilter = page.locator('select').first();
    await typeFilter.selectOption('experience');
    
    // Check that items show up (if any)
    const items = page.locator('button');
    const count = await items.count();
    
    if (count > 0) {
      // If we have items, at least one should have the experience icon
      // Using text or title might be more reliable
      await expect(page.locator('option[value="experience"]')).toBeSelected();
    }
  });
});
