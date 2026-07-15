import { createContext, useContext, useEffect, useState, createElement, type ReactNode } from 'react';
import { Preferences } from '@capacitor/preferences';

/**
 * Lightweight i18n for KukPDF (English + Hindi). No dependency — a flat
 * key→string dictionary with {var} interpolation and an English fallback.
 *
 * Scope: the whole product UI EXCEPT the auth/login screen, whose content is the
 * standardised Kuklabs auth copy (English) mandated by the Auth Pack and must not
 * be re-translated per product.
 *
 * Language is persisted in Preferences; first run defaults to the device locale
 * (Hindi if the device is set to Hindi, else English).
 */

export type Lang = 'en' | 'hi';
const KEY = 'kukpdf:lang';

type Dict = Record<string, string>;

const en: Dict = {
  // bottom nav
  'nav.home': 'Home', 'nav.tools': 'Tools', 'nav.scan': 'Scan', 'nav.files': 'Files', 'nav.profile': 'Profile',
  // common
  'common.cancel': 'Cancel', 'common.close': 'Close', 'common.save': 'Save', 'common.delete': 'Delete',
  'common.share': 'Share', 'common.download': 'Download', 'common.done': 'Done', 'common.next': 'Next',
  'common.prev': 'Prev', 'common.apply': 'Apply', 'common.view': 'View', 'common.retry': 'Try again',
  'common.working': 'Working…', 'common.pleaseWait': 'Please wait…', 'common.search': 'Search PDF',
  'common.saveToFiles': 'Save to Files & close', 'common.undo': 'Undo',
  // home
  'home.quickTools': 'Quick Tools', 'home.recentFiles': 'Recent Files', 'home.seeAll': 'See all',
  'home.noRecent': 'No documents yet — tap the scan button below to start.',
  'home.qt.view': 'View & Read', 'home.qt.edit': 'Edit PDF', 'home.qt.convert': 'Convert PDF',
  'home.qt.merge': 'Merge PDF', 'home.qt.split': 'Split PDF', 'home.qt.compress': 'Compress PDF',
  'home.qt.protect': 'Protect PDF', 'home.qt.organize': 'Organize Pages',
  'home.toolsCount': 'Tools', 'home.filesCount': 'Files',
  'home.noMatchTools': 'No matching tools.', 'home.noMatchFiles': 'No matching files.',
  // tools page
  'tools.title': 'PDF Tools', 'tools.sub': 'Create, organize, optimize, edit, OCR and secure PDFs',
  'tools.group.Create': 'Create', 'tools.group.Organize': 'Organize', 'tools.group.Optimize': 'Optimize',
  'tools.group.Convert': 'Convert', 'tools.group.Edit': 'Edit', 'tools.group.OCR & AI': 'OCR & AI',
  'tools.group.Security': 'Security',
  // files
  'files.title': 'Files', 'files.sub': 'Your scans and PDFs, stored on this device',
  'files.all': 'All', 'files.scanned': 'Scanned', 'files.pdfs': 'PDFs', 'files.favorites': 'Favorites',
  'files.secure': 'Secure', 'files.docsCount': '{n} documents', 'files.importPdf': 'Import a PDF from this device',
  'files.importing': 'Importing…', 'files.emptyHere': 'No documents here yet.',
  'files.secureHint': 'Enter your PIN in Profile → Secure Folder to view these.',
  'files.empty': 'No documents yet.', 'files.searchEmpty': 'No documents match your search.',
  // scan
  'scan.ready': 'Ready to Scan', 'scan.hint': 'Point your camera at a document — edges are detected automatically.',
  'scan.openCamera': 'Open camera', 'scan.importPhotos': 'Import photos', 'scan.importPdf': 'Import PDF',
  'scan.filter': 'Filter', 'scan.rotate': 'Rotate', 'scan.crop': 'Crop', 'scan.scanMore': 'Scan more',
  'scan.exportPdf': 'Save as PDF', 'scan.cta': 'Scan a document', 'scan.opening': 'Opening scanner…',
  'scan.saving': 'Saving…', 'scan.pagesScanned': '{n} pages scanned', 'scan.keepGoing': '· keep going or save',
  // profile
  'profile.security': 'Security', 'profile.cloudSync': 'Cloud sync', 'profile.syncNow': 'Sync now',
  'profile.syncing': 'Syncing…', 'profile.backupSync': 'Back up & sync',
  'profile.about': 'About this app', 'profile.docsOnDevice': 'Documents on this device',
  'profile.privacy': 'Privacy Policy', 'profile.terms': 'Terms of Use', 'profile.export': 'Export my documents',
  'profile.exporting': 'Exporting…', 'profile.support': 'Support', 'profile.contact': 'Contact',
  'profile.signOut': 'Sign out', 'profile.signInKuklabs': 'Sign in to Kuklabs',
  'profile.oneAccount': 'One account across every Kuk app', 'profile.savedSignatures': 'Saved signatures',
  'profile.appLockOff': 'App lock is off.', 'profile.appLockOn': 'App lock is on.',
  'profile.setPin': 'Set app PIN', 'profile.removePin': 'Remove PIN', 'profile.unlockSecure': 'Unlock Secure Folder',
  'profile.deleteData': 'Delete my data', 'profile.deleteMyKukpdf': 'Delete my KukPDF data',
  'profile.deleteAccount': 'Delete my entire Kuklabs account →',
  'profile.deleteConfirm': 'Yes, delete everything', 'profile.deleting': 'Deleting…',
  'profile.language': 'Language', 'profile.pro': 'KukPDF Pro', 'profile.upgrade': 'Upgrade to Pro',
};

const hi: Dict = {
  'nav.home': 'होम', 'nav.tools': 'टूल्स', 'nav.scan': 'स्कैन', 'nav.files': 'फ़ाइलें', 'nav.profile': 'प्रोफ़ाइल',
  'common.cancel': 'रद्द करें', 'common.close': 'बंद करें', 'common.save': 'सेव करें', 'common.delete': 'हटाएँ',
  'common.share': 'शेयर करें', 'common.download': 'डाउनलोड', 'common.done': 'हो गया', 'common.next': 'आगे',
  'common.prev': 'पीछे', 'common.apply': 'लागू करें', 'common.view': 'देखें', 'common.retry': 'फिर कोशिश करें',
  'common.working': 'काम चल रहा है…', 'common.pleaseWait': 'कृपया रुकें…', 'common.search': 'PDF खोजें',
  'common.saveToFiles': 'फ़ाइलों में सेव करके बंद करें', 'common.undo': 'वापस लाएँ',
  'home.quickTools': 'क्विक टूल्स', 'home.recentFiles': 'हाल की फ़ाइलें', 'home.seeAll': 'सभी देखें',
  'home.noRecent': 'अभी कोई दस्तावेज़ नहीं — शुरू करने के लिए नीचे स्कैन बटन दबाएँ।',
  'home.qt.view': 'देखें और पढ़ें', 'home.qt.edit': 'PDF एडिट', 'home.qt.convert': 'PDF कन्वर्ट',
  'home.qt.merge': 'PDF मर्ज', 'home.qt.split': 'PDF स्प्लिट', 'home.qt.compress': 'PDF कंप्रेस',
  'home.qt.protect': 'PDF प्रोटेक्ट', 'home.qt.organize': 'पेज व्यवस्थित करें',
  'home.toolsCount': 'टूल्स', 'home.filesCount': 'फ़ाइलें',
  'home.noMatchTools': 'कोई मिलता-जुलता टूल नहीं।', 'home.noMatchFiles': 'कोई मिलती-जुलती फ़ाइल नहीं।',
  'tools.title': 'PDF टूल्स', 'tools.sub': 'PDF बनाएँ, व्यवस्थित करें, ऑप्टिमाइज़, एडिट, OCR और सुरक्षित करें',
  'tools.group.Create': 'बनाएँ', 'tools.group.Organize': 'व्यवस्थित करें', 'tools.group.Optimize': 'ऑप्टिमाइज़',
  'tools.group.Convert': 'कन्वर्ट', 'tools.group.Edit': 'एडिट', 'tools.group.OCR & AI': 'OCR और AI',
  'tools.group.Security': 'सुरक्षा',
  'files.title': 'फ़ाइलें', 'files.sub': 'आपके स्कैन और PDF, इसी डिवाइस पर सेव',
  'files.all': 'सभी', 'files.scanned': 'स्कैन किए', 'files.pdfs': 'PDF', 'files.favorites': 'पसंदीदा',
  'files.secure': 'सुरक्षित', 'files.docsCount': '{n} दस्तावेज़', 'files.importPdf': 'इस डिवाइस से PDF इम्पोर्ट करें',
  'files.importing': 'इम्पोर्ट हो रहा है…', 'files.emptyHere': 'यहाँ अभी कोई दस्तावेज़ नहीं।',
  'files.secureHint': 'इन्हें देखने के लिए प्रोफ़ाइल → सुरक्षित फ़ोल्डर में अपना PIN डालें।',
  'files.empty': 'अभी कोई दस्तावेज़ नहीं।', 'files.searchEmpty': 'आपकी खोज से कोई दस्तावेज़ नहीं मिला।',
  'scan.ready': 'स्कैन के लिए तैयार', 'scan.hint': 'कैमरा दस्तावेज़ पर रखें — किनारे अपने-आप पहचाने जाते हैं।',
  'scan.openCamera': 'कैमरा खोलें', 'scan.importPhotos': 'फ़ोटो इम्पोर्ट करें', 'scan.importPdf': 'PDF इम्पोर्ट करें',
  'scan.filter': 'फ़िल्टर', 'scan.rotate': 'घुमाएँ', 'scan.crop': 'क्रॉप', 'scan.scanMore': 'और स्कैन करें',
  'scan.exportPdf': 'PDF के रूप में सेव करें', 'scan.cta': 'दस्तावेज़ स्कैन करें', 'scan.opening': 'स्कैनर खुल रहा है…',
  'scan.saving': 'सेव हो रहा है…', 'scan.pagesScanned': '{n} पेज स्कैन हुए', 'scan.keepGoing': '· और करें या सेव करें',
  'profile.security': 'सुरक्षा', 'profile.cloudSync': 'क्लाउड सिंक', 'profile.syncNow': 'अभी सिंक करें',
  'profile.syncing': 'सिंक हो रहा है…', 'profile.backupSync': 'बैकअप और सिंक',
  'profile.about': 'इस ऐप के बारे में', 'profile.docsOnDevice': 'इस डिवाइस पर दस्तावेज़',
  'profile.privacy': 'प्राइवेसी पॉलिसी', 'profile.terms': 'उपयोग की शर्तें', 'profile.export': 'मेरे दस्तावेज़ एक्सपोर्ट करें',
  'profile.exporting': 'एक्सपोर्ट हो रहा है…', 'profile.support': 'सहायता', 'profile.contact': 'संपर्क करें',
  'profile.signOut': 'साइन आउट', 'profile.signInKuklabs': 'Kuklabs में साइन इन करें',
  'profile.oneAccount': 'हर Kuk ऐप के लिए एक ही अकाउंट', 'profile.savedSignatures': 'सेव किए हस्ताक्षर',
  'profile.appLockOff': 'ऐप लॉक बंद है।', 'profile.appLockOn': 'ऐप लॉक चालू है।',
  'profile.setPin': 'ऐप PIN सेट करें', 'profile.removePin': 'PIN हटाएँ', 'profile.unlockSecure': 'सुरक्षित फ़ोल्डर खोलें',
  'profile.deleteData': 'मेरा डेटा हटाएँ', 'profile.deleteMyKukpdf': 'मेरा KukPDF डेटा हटाएँ',
  'profile.deleteAccount': 'मेरा पूरा Kuklabs अकाउंट हटाएँ →',
  'profile.deleteConfirm': 'हाँ, सब कुछ हटाएँ', 'profile.deleting': 'हटाया जा रहा है…',
  'profile.language': 'भाषा', 'profile.pro': 'KukPDF प्रो', 'profile.upgrade': 'प्रो में अपग्रेड करें',
};

// Tool display names — kept as their own map so ToolCard and ToolRunner share them.
const toolNamesHi: Dict = {
  'Scan to PDF': 'स्कैन टू PDF', 'Image to PDF': 'इमेज टू PDF', 'JPG to PDF': 'JPG टू PDF',
  'Merge PDF': 'PDF मर्ज', 'Split PDF': 'PDF स्प्लिट', 'Rotate PDF': 'PDF घुमाएँ',
  'Delete Pages': 'पेज हटाएँ', 'Reorder Pages': 'पेज क्रम बदलें', 'Compress PDF': 'PDF कंप्रेस',
  'Repair PDF': 'PDF रिपेयर', 'PDF to Word': 'PDF टू वर्ड', 'PDF to Excel': 'PDF टू एक्सेल',
  'Sign PDF': 'PDF साइन करें', 'Watermark': 'वॉटरमार्क', 'Page Numbers': 'पेज नंबर', 'Annotate': 'एनोटेट',
  'Image to Text': 'इमेज टू टेक्स्ट', 'Searchable PDF': 'सर्चेबल PDF', 'Summarize PDF': 'PDF सारांश',
  'Ask PDF': 'PDF से पूछें', 'Password Protect': 'पासवर्ड लगाएँ', 'Unlock PDF': 'PDF अनलॉक',
  'Secure Folder': 'सुरक्षित फ़ोल्डर',
};

const DICT: Record<Lang, Dict> = { en, hi };

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: string, v?: Record<string, string | number>) => string };
const I18nCtx = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  useEffect(() => {
    (async () => {
      const { value } = await Preferences.get({ key: KEY });
      if (value === 'hi' || value === 'en') setLangState(value);
      else if ((navigator.language || '').toLowerCase().startsWith('hi')) setLangState('hi');
    })();
  }, []);
  const setLang = (l: Lang) => { setLangState(l); Preferences.set({ key: KEY, value: l }); };
  const t = (k: string, v?: Record<string, string | number>) => {
    let s = DICT[lang][k] ?? DICT.en[k] ?? k;
    if (v) for (const [kk, vv] of Object.entries(v)) s = s.replace(`{${kk}}`, String(vv));
    return s;
  };
  return createElement(I18nCtx.Provider, { value: { lang, setLang, t } }, children);
}

export const useI18n = () => useContext(I18nCtx);
export const useT = () => useContext(I18nCtx).t;

/** Localised tool display name (English name is the stable key everywhere else). */
export function useToolName() {
  const { lang } = useI18n();
  return (name: string) => (lang === 'hi' ? toolNamesHi[name] || name : name);
}
