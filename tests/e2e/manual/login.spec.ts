import { test, expect } from '../../fixtures/page-fixtures';

test.describe('Login', () => {
  test('standard_user can log in and sees the product list', async ({ page, loginPage, users }) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.getByTestId('inventory-list')).toBeVisible();
  });

  test('locked_out_user sees the locked-out error message', async ({ loginPage, users }) => {
    await loginPage.goto();
    await loginPage.login(users.lockedOut.username, users.lockedOut.password);

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Sorry, this user has been locked out');
  });

  test('empty credentials show a required-field error', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('', '');

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Username is required');
  });
});
