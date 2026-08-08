import { test as base, expect, Page } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';

export interface SauceDemoUser {
  username: string;
  password: string;
}

export interface Users {
  standard: SauceDemoUser;
  lockedOut: SauceDemoUser;
  problem: SauceDemoUser;
  performanceGlitch: SauceDemoUser;
}

interface Fixtures {
  users: Users;
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  authenticatedPage: Page;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}. Check your .env file.`);
  }
  return value;
}

export const test = base.extend<Fixtures>({
  users: async ({}, use) => {
    const password = requireEnv('SAUCEDEMO_PASSWORD');
    await use({
      standard: { username: requireEnv('SAUCEDEMO_STANDARD_USER'), password },
      lockedOut: { username: requireEnv('SAUCEDEMO_LOCKED_OUT_USER'), password },
      problem: { username: requireEnv('SAUCEDEMO_PROBLEM_USER'), password },
      performanceGlitch: { username: requireEnv('SAUCEDEMO_PERFORMANCE_GLITCH_USER'), password },
    });
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  authenticatedPage: async ({ page, loginPage, users }, use) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await expect(page.getByTestId('inventory-list')).toBeVisible();
    await use(page);
  },
});

export { expect };
