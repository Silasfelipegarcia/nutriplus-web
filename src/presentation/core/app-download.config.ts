import { environment } from '../../environments/environment';

/** URL pública do APK Android (ex.: /downloads/nutriplus.apk). */
export const androidApkDownloadUrl = (environment.androidApkDownloadUrl ?? '').trim();

/** Rótulo exibido ao usuário (ex.: v1.1.1). */
export const androidApkVersionLabel = (environment.androidApkVersionLabel ?? '').trim();

export const hasDirectAndroidApkDownload = androidApkDownloadUrl.length > 0;
