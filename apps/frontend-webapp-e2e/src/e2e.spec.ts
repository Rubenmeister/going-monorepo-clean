import { test, expect } from '@playwright/test';

test.describe('Global Health Monitor (Passive Agent)', () => {
  
  test('Service Availability: Frontend Webapp', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Going/i);
    // Check for core root element
    await expect(page.locator('#root')).toBeVisible();
  });

  test('Service Availability: API Gateway Health', async ({ request }) => {
    // We check the health endpoint directly via request context
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('Service Availability: API Gateway Readiness', async ({ request }) => {
    const response = await request.get('/api/health/ready');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('Core Navigation: Home to Activity', async ({ page }) => {
    // Mock login to bypass auth for simple navigation check
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-passive-token');
      localStorage.setItem('user', JSON.stringify({ id: 'passive-agent', role: 'user' }));
    });
    
    await page.goto('/c/activity');
    // Header should be visible
    await expect(page.locator('h1')).toBeVisible();
  });
});
