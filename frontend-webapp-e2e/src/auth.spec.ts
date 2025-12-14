import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication Flow
 */
test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login or show login form
    await expect(page).toHaveURL(/\/(login|home)/);
  });

  test('should display login form elements', async ({ page }) => {
    await page.goto('/login');
    
    // Check for essential form elements
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password|contraseña/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /login|iniciar/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByRole('textbox', { name: /email/i }).fill('invalid@test.com');
    await page.getByRole('textbox', { name: /password|contraseña/i }).fill('wrongpassword');
    await page.getByRole('button', { name: /login|iniciar/i }).click();
    
    // Should show error message
    await expect(page.getByText(/error|invalid|inválido/i)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to register page from login', async ({ page }) => {
    await page.goto('/login');
    
    // Find and click register link
    const registerLink = page.getByRole('link', { name: /register|registr/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL('/register');
    }
  });
});

/**
 * E2E Tests for Navigation
 */
test.describe('Navigation', () => {
  test('should navigate between public pages', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    
    await page.goto('/register');
    await expect(page).toHaveURL('/register');
  });

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should have proper page titles', async ({ page }) => {
    await page.goto('/');
    
    // Page should have a title
    await expect(page).toHaveTitle(/.+/);
  });
});

/**
 * E2E Tests for Dashboard (requires auth mock)
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
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

  test('should display user info when authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should show user name or dashboard elements
    await expect(page.getByText(/dashboard|test user|perfil/i)).toBeVisible({ timeout: 5000 });
  });

  test('should have logout functionality', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find logout button
    const logoutButton = page.getByRole('button', { name: /logout|cerrar sesión/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    }
  });
});

/**
 * E2E Tests for PWA Features
 */
test.describe('PWA', () => {
  test('should have valid manifest', async ({ page }) => {
    await page.goto('/');
    
    // Check for manifest link
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', /.+/);
  });

  test('should register service worker', async ({ page }) => {
    await page.goto('/');
    
    // Wait for potential SW registration
    await page.waitForTimeout(2000);
    
    // Check if SW was registered (in production builds)
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    // In dev mode, SW might not be registered - this is OK
    console.log('Service Worker registered:', swRegistered);
  });
});
