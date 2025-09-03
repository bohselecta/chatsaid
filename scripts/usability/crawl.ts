import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';

const STARTS = [
  '/',
  '/canopy',
  '/explore',
  '/branch/funny',
  '/branch/mystical',
  '/branch/technical',
  '/branch/research',
  '/branch/ideas',
];
const MAX_PAGES = 60;
const OUTDIR = 'reports/usability';

function norm(u: string) {
  try {
    const url = new URL(u);
    return url.pathname + url.search;
  } catch {
    return u;
  }
}

async function main() {
  await fs.mkdir(OUTDIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: process.env.BASE_URL || 'http://localhost:3000' });
  const page = await context.newPage();

  const queue = Array.from(new Set(STARTS));
  const seen = new Set<string>();
  const graph: Record<string, { title: string; links: string[]; headings: string[]; landmarks: string[]; a11y: any }> = {};

  while (queue.length && seen.size < MAX_PAGES) {
    const route = queue.shift()!;
    if (seen.has(route)) continue;
    seen.add(route);

    await page.goto(route, { waitUntil: 'domcontentloaded' });

    const title = await page.title();
    const links = (
      await page.$$eval('a[href^="/"]', (as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href') || '').filter(Boolean))
    ).map(norm);
    const headings = await page.$$eval('h1, h2', (els) => els.map((e) => (e as HTMLElement).innerText.trim()));
    const landmarks = await page.$$eval('header, main, nav, footer', (els) => els.map((e) => e.tagName.toLowerCase()));

    const axe = await new AxeBuilder({ page }).analyze();

    graph[route] = { title, links, headings, landmarks, a11y: axe };

    for (const l of links) if (!seen.has(l) && l.startsWith('/')) queue.push(l);

    const shot = path.join(OUTDIR, route.replaceAll('/', '_') || '_home') + '.png';
    await page.screenshot({ path: shot, fullPage: true });
  }

  await browser.close();
  await fs.writeFile(path.join(OUTDIR, 'graph.json'), JSON.stringify(graph, null, 2));
  console.log(`[ua] Crawled ${Object.keys(graph).length} pages → ${OUTDIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

