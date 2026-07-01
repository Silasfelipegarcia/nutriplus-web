// Gerado por scripts/generate-environment.mjs — não edite manualmente em CI.
export const environment = {
  production: true,
  apiBaseUrl: 'https://nutriplus-api-production.up.railway.app',
  appStoreUrl: 'https://apps.apple.com/app/nutriplus',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=br.com.nutriplus',
  androidApkDownloadUrl: '/downloads/nutriplus.apk',
  androidApkVersionLabel: 'v1.1.1',
  iosTestFlightUrl: (process.env.IOS_TESTFLIGHT_URL || '').trim(),
  iosAdHocManifestPath: (process.env.IOS_ADHOC_MANIFEST_PATH || '').trim(),
  iosVersionLabel: (process.env.IOS_VERSION_LABEL || 'v1.1.1').trim(),
  gaId: 'G-L11DG3Z3ZC',
  siteUrl: 'https://nutriplus.app.br',
  mercadoPagoPublicKey: '',
  termsVersion: '1.0',
  privacyVersion: '1.0',
};
