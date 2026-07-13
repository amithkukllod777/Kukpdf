import fs from 'node:fs';

const file = 'android/app/build.gradle';
let text = fs.readFileSync(file, 'utf8');

if (!process.env.KUKPDF_STORE_PASSWORD || !process.env.KUKPDF_KEY_ALIAS || !process.env.KUKPDF_KEY_PASSWORD) {
  throw new Error('Missing one or more signing environment variables');
}

if (!text.includes('signingConfigs {')) {
  text = text.replace(
    /android\s*\{/,
    `android {\n    signingConfigs {\n        release {\n            storeFile file('kukpdf-upload.jks')\n            storePassword System.getenv('KUKPDF_STORE_PASSWORD')\n            keyAlias System.getenv('KUKPDF_KEY_ALIAS')\n            keyPassword System.getenv('KUKPDF_KEY_PASSWORD')\n        }\n    }`
  );
}

text = text.replace(
  /release\s*\{([\s\S]*?)\n\s*\}/,
  (match, body) => {
    if (body.includes('signingConfig signingConfigs.release')) return match;
    return `release {${body}\n            signingConfig signingConfigs.release\n        }`;
  }
);

fs.writeFileSync(file, text);
console.log('Configured Android release signing');
