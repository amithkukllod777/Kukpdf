import { useState } from 'react';
import { Lock } from 'lucide-react';
import { verifyPin } from '../capacitor/lock';

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  async function submit() {
    if (await verifyPin(pin)) {
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  }

  return (
    <div className="lock-screen">
      <Lock size={40} />
      <h1>KukPDF is locked</h1>
      <input
        inputMode="numeric"
        maxLength={6}
        placeholder="Enter PIN"
        value={pin}
        autoFocus
        onChange={(e) => { setError(false); setPin(e.target.value.replace(/\D/g, '')); }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      {error && <p className="viewer-status error">Wrong PIN</p>}
      <button className="primary wide" onClick={submit}>Unlock</button>
    </div>
  );
}
