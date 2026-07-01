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
const gaId = (process.env.GA_MEASUREMENT_ID || 'G-L11DG3Z3ZC').trim();
const siteUrl = (process.env.SITE_URL || 'https://nutriplus.app.br').trim().replace(/\/$/, '');

const mpPublicKey = (process.env.MERCADOPAGO_PUBLIC_KEY || '').trim();
const iosTestFlightUrl = (process.env.IOS_TESTFLIGHT_URL || '').trim();
const iosAdHocManifestPath = (process.env.IOS_ADHOC_MANIFEST_PATH || '').trim();
const iosVersionLabel = (process.env.IOS_VERSION_LABEL || 'v1.1.2').trim();

const content = `// Gerado por scripts/generate-environment.mjs — não edite manualmente em CI.
export const environment = {
  production: true,
  apiBaseUrl: '${resolved}',
  appStoreUrl: 'https://apps.apple.com/app/nutriplus',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=br.com.nutriplus',
  androidApkDownloadUrl: '/downloads/nutriplus.apk',
  androidApkVersionLabel: 'v1.1.2',
  iosTestFlightUrl: '${iosTestFlightUrl}',
  iosAdHocManifestPath: '${iosAdHocManifestPath}',
  iosVersionLabel: '${iosVersionLabel}',
  gaId: '${gaId}',
  siteUrl: '${siteUrl}',
  mercadoPagoPublicKey: '${mpPublicKey}',
  termsVersion: '1.0',
  privacyVersion: '1.0',
};
`;

writeFileSync(path.join(root, 'src/environments/environment.prod.ts'), content);
console.log(`environment.prod.ts → apiBaseUrl=${resolved}`);
