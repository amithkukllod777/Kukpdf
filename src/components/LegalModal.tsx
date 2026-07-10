const PRIVACY = `KukPDF Privacy Policy (draft)

KukPDF is developed by Kuklabs Inc.

What stays on your device:
- Scanned images, generated PDFs and signatures are stored only in this device's
  local app storage (IndexedDB / app sandbox). Nothing is uploaded to any KukPDF
  or Kuklabs server — there is currently no backend for this app.

What leaves your device:
- OCR (English and Hindi) runs fully on-device using a bundled offline engine —
  no document content or image is ever sent anywhere for OCR.
- If you use Share, the document is handed to the app you choose (WhatsApp,
  Email, Drive, etc.) via the OS share sheet — that transfer is governed by
  that app's own policy, not KukPDF's.

Your control:
- Deleting a document from Files removes it from local storage immediately.
- A PIN can be set to lock the Secure Folder within the app.
- Uninstalling the app removes all locally stored documents.

This is a draft policy for a client-only build and must be reviewed by Kuklabs
before the app is submitted to the Play Store — Play Console requires a
Privacy Policy hosted at a public URL plus a completed Data Safety form.`;

const TERMS = `KukPDF Terms of Service (draft)

KukPDF is provided by Kuklabs Inc. "as is", without warranty of any kind,
for scanning and editing your own documents.

- You are responsible for the content you scan, store and share using KukPDF.
- Some tools (Password Protect/Unlock PDF, AI Summarize/Ask PDF, cloud sync,
  subscriptions) are not implemented in this build yet and are shown for
  roadmap purposes only.
- Kuklabs Inc. may update these terms as the product evolves.

This is a draft for internal/testing use and must be finalized by Kuklabs
before public release.`;

export default function LegalModal({ doc, onClose }: { doc: 'privacy' | 'terms'; onClose: () => void }) {
  const text = doc === 'privacy' ? PRIVACY : TERMS;
  return (
    <div className="modal">
      <div className="sheet">
        <h2>{doc === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}</h2>
        <div className="ocr-result"><pre>{text}</pre></div>
        <div className="actions"><button onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}
