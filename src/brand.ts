import pkg from '../package.json';

/**
 * Central product brand config — KUKLABS_IDENTITY.md §4.
 * The ONLY things a Kuklabs product may vary: name, icon, tagline, accent.
 * Everything else (neutral tokens, typography, nav sizing, profile structure)
 * is the shared Kuklabs standard and lives in styles.css / the shared layout.
 */
export const productBrand = {
  productId: 'kukpdf',
  productName: 'KukPDF',
  productShortName: 'PDF',
  /** Split point so the name can render "Kuk" (ink) + "PDF" (accent), like KukKeep. */
  nameHead: 'Kuk',
  nameTail: 'PDF',
  icon: '/kukpdf-mark.png',
  tagline: 'Scan, edit & secure PDFs — synced with your Kuklabs account.',
  /** accent-600, WCAG-AA (5.17:1 on white). See the accent ramp in styles.css. */
  accentColor: '#2563EB',
  accentColorDark: '#60A5FA',
  termsUrl: 'https://kuklabs.com/terms',
  privacyUrl: 'https://kuklabs.com/privacy',
  supportUrl: 'https://kuklabs.com/support',
  accountUrl: 'https://account.kuklabs.com',
  website: 'kuklabs.com',
} as const;

export const appVersion = pkg.version;
/** Monotonic store build number — mirrors the Android versionCode. Bump per release. */
export const appBuild = 1;
/** "Version 0.1.0 (Build 1)" — KUKLABS_IDENTITY.md §18.2 format. */
export const versionLabel = `Version ${appVersion} (Build ${appBuild})`;
