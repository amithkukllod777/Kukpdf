# KukPDF — Competitive Roadmap

Priority scoring (1–5 each): UserImpact · BusinessImpact · CompetitiveUrgency · Frequency · EvidenceConfidence · Effort(lower=easier) · Maintenance · Risk. Bucketed P0–P3 / DO-NOT-BUILD.

## Immediate (this release cycle)
| Item | Problem solved | Evidence | Effort | Success metric |
|---|---|---|---|---|
| **P0 — Unlock / remove password** | Table-stakes gap; iLovePDF has it; pairs with add-password | Feature matrix (P) | M (needs qpdf-style server or a client lib that truly decrypts) | Users can open a password PDF they own; task success ≥90% |
| **P0 — Verify + market free Hindi OCR** | The India wedge; rivals' Indian-script OCR unconfirmed | Matrix (P/NV) | S (validate) | Measured Hindi OCR accuracy on a test set; store copy updated |
| **P1 — Account deletion + data export** | Play/GDPR expectation; currently missing | Options gap | M | In-app delete+export flows; Play Data-safety passes |

## Next release
| Item | Problem | Effort | Metric |
|---|---|---|---|
| P1 — Export scan/PDF → Word/Excel | Only true capability disadvantage; real SMB workflow | L (server/AI) | Editable export usable; conversion success rate |
| P1 — Promote "all tools free · no ads · offline · private" in onboarding + store | The moat isn't communicated | S | Install→first-scan conversion; store CTR |
| P2 — Hindi app UI (i18n) | India market fit | M | Hindi-locale retention |
| P2 — OCR progress + cancel; tool success toasts; delete confirm/undo | UX polish gaps vs rivals | S | Fewer mis-taps/abandonment |

## Next quarter
| Item | Problem | Effort |
|---|---|---|
| P2 — AI "summarize / ask this document" (via KukLabs AI Engine) | Differentiator vs iLovePDF, parity w/ Adobe/CamScanner | M (reuses shared `invokeLLM`) |
| P2 — More Indian scripts (Tamil/Telugu/Bengali/Marathi) | Deepen the moat | M |
| P2 — Compression quality levels + page-size (A4/Letter) | Parity | S |
| P3 — Fillable forms / request-signature | Nice-to-have | L |

## Long-term
- App Links (verified https deep links) + secure token storage (see SECURITY_AUDIT) · crash reporting/analytics · optional Drive export.

## DO NOT BUILD
- Credit systems, cloud-storage tiers, ad-supported free tier, export watermarks — these are the incumbents' monetization crutches; adopting them **destroys KukPDF's core "free + private" advantage.** Compete on price/privacy, not by copying paywalls.
