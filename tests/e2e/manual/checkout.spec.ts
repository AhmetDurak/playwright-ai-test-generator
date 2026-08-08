import { test, expect } from '../../fixtures/page-fixtures';
import { faker } from '@faker-js/faker';

test.describe('Checkout', () => {
  test('user can add a product to the cart and complete checkout', async ({
    authenticatedPage: page,
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await expect(inventoryPage.cartBadge).toHaveText('1');

    await inventoryPage.goToCart();
    await expect(page).toHaveURL(/cart\.html/);
    await expect(cartPage.cartItem).toHaveCount(1);

    await cartPage.checkout();
    await checkoutPage.fillInfo({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      postalCode: faker.location.zipCode(),
    });
    await checkoutPage.finish();

    await expect(checkoutPage.completeHeader).toBeVisible();
    await expect(checkoutPage.completeHeader).toContainText('Thank you for your order');
  });
});
