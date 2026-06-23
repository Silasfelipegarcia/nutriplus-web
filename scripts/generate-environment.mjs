#!/usr/bin/env node
/**
 * Gera environment.prod.ts no build (Vercel/Railway).
 * Defina API_BASE_URL nas Environment Variables do Vercel.
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiBaseUrl = (process.env.API_BASE_URL || process.env.NG_APP_API_BASE_URL || '')
  .trim()
  .replace(/\/$/, '');

const productionDefault = 'https://nutriplus-api-production.up.railway.app';

if (!apiBaseUrl) {
  if (process.env.VERCEL) {
    console.warn(
      `API_BASE_URL não definida no Vercel; usando padrão de produção: ${productionDefault}`,
    );
  } else {
    console.warn(`API_BASE_URL ausente; usando padrão de produção: ${productionDefault}`);
  }
}

const resolved = apiBaseUrl || productionDefault;

const content = `// Gerado por scripts/generate-environment.mjs — não edite manualmente em CI.
export const environment = {
  production: true,
  apiBaseUrl: '${resolved}',
  appStoreUrl: 'https://apps.apple.com/app/nutriplus',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=br.com.nutriplus',
  gaId: '',
  termsVersion: '1.0',
  privacyVersion: '1.0',
};
`;

writeFileSync(path.join(root, 'src/environments/environment.prod.ts'), content);
console.log(`environment.prod.ts → apiBaseUrl=${resolved}`);
