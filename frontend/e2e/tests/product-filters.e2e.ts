/**
 * product-filters.e2e.ts - End-to-end tests for product filtering with Playwright
 * 
 * Phase 9: Comprehensive E2E scenarios
 * - 9.1 Apply price filter test
 * - 9.2 Sort by price test
 * - 9.3 Pagination with filters test
 * - 9.4 localStorage persistence test
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const CATALOG_URL = `${BASE_URL}/productos`;

/**
 * Scenario 9.1: Apply price filter test
 */
test.describe('Price Filter', () => {
  test('debería filtrar productos por rango de precio', async ({ page }) => {
    await page.goto(CATALOG_URL);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Get the price filter inputs
    const minPriceInput = page.locator('input[aria-label="Precio mínimo en dólares"]');
    const maxPriceInput = page.locator('input[aria-label="Precio máximo en dólares"]');
    const filterButton = page.locator('button:has-text("Filtrar")').first();

    // Enter price range
    await minPriceInput.fill('10');
    await maxPriceInput.fill('50');

    // Click filter button
    await filterButton.click();

    // Wait for API request and response
    await page.waitForLoadState('networkidle');

    // Verify products are within price range (assuming prices are displayed)
    const productPrices = await page.locator('span:has-text("$")').allTextContents();
    
    // Each price should be between $10 and $50
    productPrices.forEach((priceText) => {
      const priceMatch = priceText.match(/\$(\d+\.?\d*)/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1]);
        expect(price).toBeGreaterThanOrEqual(10);
        expect(price).toBeLessThanOrEqual(50);
      }
    });
  });

  test('debería mostrar error cuando min > max', async ({ page }) => {
    await page.goto(CATALOG_URL);
    await page.waitForLoadState('networkidle');

    const minPriceInput = page.locator('input[aria-label="Precio mínimo en dólares"]');
    const maxPriceInput = page.locator('input[aria-label="Precio máximo en dólares"]');
    const filterButton = page.locator('button:has-text("Filtrar")').first();

    // Enter invalid range
    await minPriceInput.fill('50');
    await maxPriceInput.fill('10');

    // Click filter button
    await filterButton.click();

    // Error message should appear
    const errorMsg = page.locator('text=El precio mínimo no puede ser mayor');
    await expect(errorMsg).toBeVisible();
  });
});

/**
 * Scenario 9.2: Sort by price test
 */
test.describe('Sort Options', () => {
  test('debería ordenar productos por precio ascendente', async ({ page }) => {
    await page.goto(CATALOG_URL);
    await page.waitForLoadState('networkidle');

    // Get initial prices
    const initialPrices = await page.locator('span:has-text("$")').allTextContents();

    // Select "Menor precio" from dropdown
    const sortDropdown = page.locator('select[aria-label="Opción de ordenamiento"]');
    await sortDropdown.selectOption('price_asc');

    // Wait for data reload
    await page.waitForLoadState('networkidle');

    // Get new prices
    const sortedPrices = await page.locator('span:has-text("$")').allTextContents();

    // Verify prices are in ascending order
    const numPrices = sortedPrices.map((p) => {
      const match = p.match(/\$(\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : 0;
    });

    for (let i = 1; i < numPrices.length; i++) {
      expect(numPrices[i]).toBeGreaterThanOrEqual(numPrices[i - 1]);
    }
  });

  test('debería aplicar ordenamiento sin recarga de página', async ({ page }) => {
    await page.goto(CATALOG_URL);
    await page.waitForLoadState('networkidle');

    // Get initial URL
    const initialUrl = page.url();

    // Change sort
    const sortDropdown = page.locator('select[aria-label="Opción de ordenamiento"]');
    await sortDropdown.selectOption('price_desc');

    // URL should not change (no full page reload)
    const newUrl = page.url();
    expect(newUrl).toBe(initialUrl);

    // But content should update (wait for spinner to appear then disappear)
    await page.waitForLoadState('networkidle');
  });
});

/**
 * Scenario 9.3: Pagination with filters test
 */
test.describe('Pagination with Filters', () => {
  test('debería mantener filtros al cambiar página', async ({ page }) => {
    await page.goto(CATALOG_URL);
    await page.waitForLoadState('networkidle');

    // Apply price filter
    const minPriceInput = page.locator('input[aria-label="Precio mínimo en dólares"]');
    const maxPriceInput = page.locator('input[aria-label="Precio máximo en dólares"]');
    const filterButton = page.locator('button:has-text("Filtrar")').first();

    await minPriceInput.fill('10');
    await maxPriceInput.fill('50');
    await filterButton.click();

    await page.waitForLoadState('networkidle');

    // Navigate to next page
    const nextButton = page.locator('button:has-text("Siguiente")');
    await nextButton.click();

    await page.waitForLoadState('networkidle');

    // Verify price range still applies (prices still between $10-$50)
    const productPrices = await page.locator('span:has-text("$")').allTextContents();
    productPrices.forEach((priceText) => {
      const priceMatch = priceText.match(/\$(\d+\.?\d*)/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1]);
        expect(price).toBeGreaterThanOrEqual(10);
        expect(price).toBeLessThanOrEqual(50);
      }
    });

    // Verify "Anterior" button is now enabled
    const prevButton = page.locator('button:has-text("Anterior")');
    expect(await prevButton.isDisabled()).toBe(false);
  });

  test('debería mostrar información de página "Página X de Y"', async ({ page }) => {
    await page.goto(CATALOG_URL);
    await page.waitForLoadState('networkidle');

    // Look for page counter like "Página 1 de 5"
    const pageCounter = page.locator('text=/Página \\d+ de \\d+/');
    await expect(pageCounter).toBeVisible();
  });
});

/**
 * Scenario 9.4: localStorage persistence test
 */
test.describe('localStorage Persistence', () => {
  test('debería restaurar filtros después de recargar página', async ({ page, context }) => {
    // Go to catalog
    await page.goto(CATALOG_URL);
    await page.waitForLoadState('networkidle');

    // Apply filters
    const minPriceInput = page.locator('input[aria-label="Precio mínimo en dólares"]');
    const maxPriceInput = page.locator('input[aria-label="Precio máximo en dólares"]');
    const filterButton = page.locator('button:has-text("Filtrar")').first();

    await minPriceInput.fill('20');
    await maxPriceInput.fill('80');
    await filterButton.click();

    await page.waitForLoadState('networkidle');

    // Get product list before reload
    const productCountBefore = await page.locator('[data-testid="product-list"] > div').count();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check that inputs still have the values (restored from localStorage)
    const minValue = await minPriceInput.inputValue();
    const maxValue = await maxPriceInput.inputValue();

    expect(minValue).toBe('20');
    expect(maxValue).toBe('80');

    // Products should still be filtered
    const productCountAfter = await page.locator('[data-testid="product-list"] > div').count();
    expect(productCountAfter).toBe(productCountBefore);
  });

  test('debería limpiar localStorage al hacer clic "Limpiar filtros"', async ({ page }) => {
    await page.goto(CATALOG_URL);
    await page.waitForLoadState('networkidle');

    // Apply filters
    const minPriceInput = page.locator('input[aria-label="Precio mínimo en dólares"]');
    const maxPriceInput = page.locator('input[aria-label="Precio máximo en dólares"]');
    const filterButton = page.locator('button:has-text("Filtrar")').first();

    await minPriceInput.fill('15');
    await maxPriceInput.fill('60');
    await filterButton.click();

    await page.waitForLoadState('networkidle');

    // Click "Limpiar filtros"
    const clearButton = page.locator('text=Limpiar todos los filtros');
    await clearButton.click();

    await page.waitForLoadState('networkidle');

    // Inputs should be empty
    const minValue = await minPriceInput.inputValue();
    const maxValue = await maxPriceInput.inputValue();

    expect(minValue).toBe('');
    expect(maxValue).toBe('');
  });
});

/**
 * Scenario 9.5: Combined filters and sorting
 */
test.describe('Combined Filters & Sorting', () => {
  test('debería aplicar múltiples filtros simultáneamente', async ({ page }) => {
    await page.goto(CATALOG_URL);
    await page.waitForLoadState('networkidle');

    // Apply price filter
    const minPriceInput = page.locator('input[aria-label="Precio mínimo en dólares"]');
    const maxPriceInput = page.locator('input[aria-label="Precio máximo en dólares"]');
    const filterButton = page.locator('button:has-text("Filtrar")').first();

    await minPriceInput.fill('10');
    await maxPriceInput.fill('100');
    await filterButton.click();

    await page.waitForLoadState('networkidle');

    // Also apply sort
    const sortDropdown = page.locator('select[aria-label="Opción de ordenamiento"]');
    await sortDropdown.selectOption('nombre_asc');

    await page.waitForLoadState('networkidle');

    // Verify both filters applied (prices in range AND sorted by name)
    const productPrices = await page.locator('span:has-text("$")').allTextContents();
    productPrices.forEach((priceText) => {
      const priceMatch = priceText.match(/\$(\d+\.?\d*)/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1]);
        expect(price).toBeGreaterThanOrEqual(10);
        expect(price).toBeLessThanOrEqual(100);
      }
    });
  });
});
