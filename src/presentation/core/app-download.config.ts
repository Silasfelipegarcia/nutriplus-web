import { environment } from '../../environments/environment';

/** URL pública do APK Android (ex.: /downloads/nutriplus.apk). */
export const androidApkDownloadUrl = (environment.androidApkDownloadUrl ?? '').trim();

/** Rótulo exibido ao usuário (ex.: v1.1.1). */
export const androidApkVersionLabel = (environment.androidApkVersionLabel ?? '').trim();

/** Link público TestFlight (ex.: https://testflight.apple.com/join/XXXX). */
export const iosTestFlightUrl = (environment.iosTestFlightUrl ?? '').trim();

/** Manifest plist HTTPS para instalação Ad Hoc OTA (Safari no iPhone). */
export const iosAdHocManifestUrl = (() => {
  const manifestPath = (environment.iosAdHocManifestPath ?? '').trim();
  if (!manifestPath) return '';
  if (manifestPath.startsWith('http://') || manifestPath.startsWith('https://')) {
    return manifestPath;
  }
  const site = (environment.siteUrl ?? '').trim().replace(/\/$/, '');
  if (!site) return '';
  return `${site}${manifestPath.startsWith('/') ? manifestPath : `/${manifestPath}`}`;
})();

export const iosVersionLabel = (environment.iosVersionLabel ?? androidApkVersionLabel).trim();

export const hasDirectAndroidApkDownload = androidApkDownloadUrl.length > 0;

export const hasIosTestFlightDownload = iosTestFlightUrl.length > 0;

export const hasIosAdHocDownload = iosAdHocManifestUrl.length > 0;

/** Link itms-services:// para Safari instalar IPA Ad Hoc. */
export const iosAdHocInstallUrl = hasIosAdHocDownload
  ? `itms-services://?action=download-manifest&url=${encodeURIComponent(iosAdHocManifestUrl)}`
  : '';

export const hasAnyIosDownload = hasIosTestFlightDownload || hasIosAdHocDownload;

export const hasAnyMobileDownload =
  hasDirectAndroidApkDownload || hasAnyIosDownload;
