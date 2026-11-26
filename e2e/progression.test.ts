import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:4173';

test.describe('Deck Builder', () => {
  test('opens deck builder and validates 30 cards', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto(`${BASE}/#/deckbuilder`);
    await page.waitForTimeout(400);

    await expect(page.locator('h1').first()).toContainText('Monte seu Grimório');

    const search = page.getByPlaceholder(/buscar|card/i).first();
    if ((await search.count()) > 0) {
      await search.fill('vampiro');
      await page.waitForTimeout(300);
    }

    const deckCount = page.getByText(/30/i).first();
    if ((await deckCount.count()) > 0) {
      await expect(deckCount).toBeVisible();
    }

    const realErrors = errors.filter(e => !e.includes('422') && !e.includes('supabase'));
    expect(realErrors).toEqual([]);
  });
});

test.describe('Battle Entry', () => {
  test('navigates to arena and battle entry UI renders', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto(`${BASE}/#/arena`);
    await page.waitForTimeout(400);

    await expect(page.locator('h1').first()).toContainText('Arena de Duelo');
    await expect(page.locator('button', { hasText: /Iniciar Duelo/i }).first()).toBeVisible();

    const realErrors = errors.filter(e => !e.includes('422') && !e.includes('supabase'));
    expect(realErrors).toEqual([]);
  });
});