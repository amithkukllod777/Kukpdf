import { useState } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Eye, EyeOff, Lock, Mail, Smartphone, User } from 'lucide-react';
import { productBrand } from '../brand';
import {
  directLogin, directRegister, forgotPassword, googleSignInUrl,
  resendOtp, resetPassword, verifyLoginOtp, verifyOtp,
} from '../kuklabs/authClient';
import { authMessages, friendlyError } from '../auth/authMessages';
import { isEmail, isPhone, isValidIdentity, toE164 } from '../auth/identityDetection';

type Mode = 'login' | 'signup' | 'loginOtp' | 'signupOtp' | 'forgot' | 'reset';

/** Standard Kuklabs password policy: 8+ chars with at least one letter and one number. */
const isStrongPassword = (v: string) => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);

/** Kuklabs Auth Screen — KUKLABS_IDENTITY.md §15. One account, three methods. */
export default function Login({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [identity, setIdentity] = useState(''); // email or phone for login
  const [email, setEmail] = useState(''); // canonical email for signup / reset
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isTab = mode === 'login' || mode === 'signup';

  function reset(next: Mode) { setError(null); setNotice(null); setOtp(''); setMode(next); }

  /** Validation errors are already friendly; only wrap thrown/server errors. */
  async function run(fn: () => Promise<void>, invalidFallback: string = authMessages.genericFallback) {
    setError(null); setLoading(true);
    try {
      await fn();
    } catch (e: any) {
      // A ValidationMessage carries a ready friendly string; pass it through.
      setError(e?.friendly ? e.message : friendlyError(e, invalidFallback));
    } finally {
      setLoading(false);
    }
  }

  /** Throws a pre-friendly validation error that run() surfaces verbatim. */
  function fail(message: string): never {
    const err = new Error(message) as Error & { friendly?: boolean };
    err.friendly = true;
    throw err;
  }

  const submitLogin = () => run(async () => {
    if (!identity.trim()) fail(authMessages.emptyIdentity);
    if (!isValidIdentity(identity)) fail(isEmail(identity) ? authMessages.invalidEmail : authMessages.invalidPhone);
    if (!password) fail(authMessages.emptyPassword);
    // Phone identities submit in E.164; email is passed through unchanged.
    const submitId = isPhone(identity) ? toE164(identity) : identity.trim();
    const { mfaRequired } = await directLogin(submitId, password);
    if (mfaRequired) { setEmail(submitId); reset('loginOtp'); setNotice('We sent a 6-digit code to your email.'); }
    else onDone();
  }, authMessages.genericSignInError);

  const submitSignup = () => run(async () => {
    if (name.trim().length < 2) fail(authMessages.emptyName);
    if (!isEmail(email)) fail(authMessages.invalidEmail);
    if (!isPhone(phone)) fail(authMessages.invalidPhone);
    if (!isStrongPassword(password)) fail(authMessages.weakPassword);
    await directRegister({ name: name.trim(), email: email.trim(), phone: toE164(phone), password });
    reset('signupOtp'); setNotice(`We sent a 6-digit code to ${email.trim()}.`);
  });

  const submitOtp = () => run(async () => {
    if (otp.length !== 6) fail(authMessages.otpInvalid);
    if (mode === 'signupOtp') await verifyOtp(email, otp);
    else await verifyLoginOtp(email, otp);
    onDone();
  });

  const submitForgot = () => run(async () => {
    if (!isEmail(email)) fail(authMessages.invalidEmail);
    await forgotPassword(email.trim());
    reset('reset'); setNotice(`We sent a reset code to ${email.trim()}.`);
  });

  const submitReset = () => run(async () => {
    if (otp.length !== 6) fail(authMessages.otpInvalid);
    if (!isStrongPassword(password)) fail(authMessages.weakPassword);
    await resetPassword(email.trim(), otp, password);
    reset('login'); setNotice('Password updated. Please sign in.');
  });

  const google = () => run(async () => {
    // System-browser + deep-link flow (KUKLABS_IDENTITY.md §3.1). The browser
    // completes Google auth; the backend hands a one-time code back to the app
    // via the kukpdf://auth deep link, caught by the appUrlOpen listener in App.tsx.
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url: googleSignInUrl('/') });
      setNotice('Continue in the browser — you’ll come back to the app automatically.');
      return;
    }
    // Web (pdf.kuklabs.com): cookie-based, same-tab redirect.
    window.location.href = googleSignInUrl(window.location.pathname || '/');
  }, authMessages.genericSignInError);

  return (
    <div className="auth">
      {/* Decorative zone (§8.3) — visual only, never defines layout height; a
          KukPDF-themed take on the approved reference's floating cards. Hidden on
          short screens / when the keyboard is open so it never crowds the form. */}
      <div className="auth-bg" aria-hidden="true">
        <span className="auth-card c1" />
        <span className="auth-card c2" />
        <span className="auth-card c3" />
        <span className="auth-card c4" />
        <span className="auth-card c5" />
        <span className="auth-card c6" />
      </div>
      <button className="auth-close" onClick={onClose} aria-label="Close">✕</button>
      <div className="auth-inner">
        <img className="auth-icon" src={productBrand.icon} alt={productBrand.productName} />
        <p className="auth-welcome">Welcome to</p>
        <h1 className="auth-name">{productBrand.nameHead}<span>{productBrand.nameTail}</span></h1>
        <p className="auth-tagline">{productBrand.tagline}</p>

        {isTab && (
          <div className="auth-tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => reset('login')}>Login</button>
            <button className={mode === 'signup' ? 'active' : ''} onClick={() => reset('signup')}>Sign Up</button>
          </div>
        )}

        {notice && <p className="auth-notice">{notice}</p>}
        {error && <p className="auth-error">{error}</p>}

        {mode === 'signup' && (
          <label className="auth-field">
            <User size={20} />
            <input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
        )}

        {(mode === 'login') && (
          <label className="auth-field">
            <Smartphone size={20} />
            <input placeholder="Mobile Number or Email" value={identity} onChange={(e) => setIdentity(e.target.value)} autoComplete="username" />
          </label>
        )}
        {(mode === 'signup') && (
          <>
            <label className="auth-field">
              <Mail size={20} />
              <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <label className="auth-field">
              <Smartphone size={20} />
              <input placeholder="Mobile Number (+91…)" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" />
            </label>
          </>
        )}

        {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
          <label className="auth-field">
            <Lock size={20} />
            <input placeholder={mode === 'reset' ? 'New Password' : 'Password'} type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            <button type="button" className="auth-eye" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </label>
        )}

        {mode === 'forgot' && (
          <label className="auth-field">
            <Mail size={20} />
            <input placeholder="Account Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
        )}

        {(mode === 'loginOtp' || mode === 'signupOtp' || mode === 'reset') && (
          <label className="auth-field">
            <Mail size={20} />
            <input placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" />
          </label>
        )}

        {mode === 'login' && (
          <button className="auth-link-right" onClick={() => { setEmail(identity.includes('@') ? identity : ''); reset('forgot'); }}>Forgot Password?</button>
        )}

        <button className="auth-primary" disabled={loading} onClick={
          mode === 'login' ? submitLogin
            : mode === 'signup' ? submitSignup
            : mode === 'forgot' ? submitForgot
            : mode === 'reset' ? submitReset
            : submitOtp
        }>
          {loading ? 'Please wait…'
            : mode === 'login' ? 'Login'
            : mode === 'signup' ? 'Create Account'
            : mode === 'forgot' ? 'Send Reset Code'
            : mode === 'reset' ? 'Update Password'
            : 'Verify'}
        </button>

        {(mode === 'loginOtp' || mode === 'signupOtp') && (
          <button className="auth-link" disabled={loading} onClick={() => run(() => resendOtp(email))}>Resend code</button>
        )}
        {(mode === 'forgot' || mode === 'reset' || mode === 'loginOtp' || mode === 'signupOtp') && (
          <button className="auth-link" onClick={() => reset('login')}>Back to login</button>
        )}

        {isTab && (
          <>
            <div className="auth-or"><span>or</span></div>
            <button className="auth-google" disabled={loading} onClick={google}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.48 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}

        <p className="auth-legal">
          By continuing, you agree to our{' '}
          <a href={productBrand.termsUrl} target="_blank" rel="noreferrer">Terms of Use</a> and{' '}
          <a href={productBrand.privacyUrl} target="_blank" rel="noreferrer">Privacy Policy</a>
        </p>
        <p className="auth-powered">Powered by <b>Kuklabs</b></p>
      </div>
    </div>
  );
}
