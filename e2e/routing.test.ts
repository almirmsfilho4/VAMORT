import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:4173';

test.describe('Hash Routing', () => {
  const routes = [
    { hash: '#', h1: 'A noite exige um estrategista' },
    { hash: '#/arena', h1: 'Arena de Duelo' },
    { hash: '#/campaign', h1: 'Campanha da Longa Noite' },
    { hash: '#/deckbuilder', h1: 'Monte seu Grimório' },
    { hash: '#/collection', h1: 'Catálogo de Relíquias' },
    { hash: '#/journey', h1: 'jornada na corte' },
    { hash: '#/profile', h1: 'Herói' }, // class title + name
    { hash: '#/settings', h1: 'Personalize sua experiência' },
    { hash: '#/guide', h1: 'Guia Arcano de VAMORT' },
  ];

  for (const r of routes) {
    test(`route ${r.hash} renders correctly`, async ({ page }) => {
      const errors = [];
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      await page.goto(`${BASE}/${r.hash}`);
      await page.waitForTimeout(400);
      const h1 = page.locator('h1').first();
      await expect(h1).toContainText(r.h1, { timeout: 8000 });
      const realErrors = errors.filter(e => !e.includes('422') && !e.includes('supabase'));
      expect(realErrors).toEqual([]);
    });
  }

  test('hashchange navigation works (#/arena -> #/campaign)', async ({ page }) => {
    await page.goto(`${BASE}/#/arena`);
    await page.waitForTimeout(300);
    await page.evaluate(() => { window.location.hash = '#/campaign'; });
    await page.waitForTimeout(400);
    await expect(page.locator('h1').first()).toContainText('Campanha da Longa Noite');
  });

  test('Gallery screens are removed', async ({ page }) => {
    await page.goto(`${BASE}/#/collection`);
    await page.waitForTimeout(300);
    const body = await page.locator('body').textContent();
    expect(body).not.toContain('Galeria');
  });
});