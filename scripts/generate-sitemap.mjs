#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteUrl = (process.env.SITE_URL || 'https://nutriplus.com.br').trim().replace(/\/$/, '');
const lastmod = new Date().toISOString().slice(0, 10);

const pages = [
  { loc: '/', priority: '1.0' },
  { loc: '/beta', priority: '0.9' },
  { loc: '/baixar-app', priority: '0.6' },
  { loc: '/privacidade', priority: '0.5' },
  { loc: '/termos', priority: '0.5' },
  { loc: '/cookies', priority: '0.4' },
  { loc: '/seguranca', priority: '0.4' },
];

const body = pages
  .map(
    (p) =>
      `  <url><loc>${siteUrl}${p.loc === '/' ? '/' : p.loc}</loc><lastmod>${lastmod}</lastmod><priority>${p.priority}</priority></url>`,
  )
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

writeFileSync(path.join(root, 'public/sitemap.xml'), xml);
console.log(`sitemap.xml → ${siteUrl} (${pages.length} URLs, lastmod=${lastmod})`);
