import { Preferences } from '@capacitor/preferences';

const PIN_KEY = 'kukpdf:pin-hash';

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`kukpdf:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hasPin(): Promise<boolean> {
  const { value } = await Preferences.get({ key: PIN_KEY });
  return !!value;
}

export async function setPin(pin: string): Promise<void> {
  await Preferences.set({ key: PIN_KEY, value: await hashPin(pin) });
}

export async function clearPin(): Promise<void> {
  await Preferences.remove({ key: PIN_KEY });
}

export async function verifyPin(pin: string): Promise<boolean> {
  const { value } = await Preferences.get({ key: PIN_KEY });
  if (!value) return true;
  return value === (await hashPin(pin));
}
