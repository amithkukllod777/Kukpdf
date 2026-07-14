# KukPDF — UI/UX Competitive Audit

Principles extracted from competitors (no visual imitation / no copyrighted assets). Checked 2026-07-14.

| Screen / workflow | KukPDF current | Competitor benchmark | Problem / gap | User impact | Recommendation | Priority |
|---|---|---|---|---|---|---|
| **First-run** | Scanner auto-opens on cold launch (scanner-first) | Adobe/CamScanner: brief onboarding then scan | Fast, but no 1st-run explainer of the free-toolkit/privacy story | Low | Add a one-time 2–3 slide value intro ("all tools free, offline, private") — the moat message | P2 |
| **Home** | Wordmark + search + colourful Quick Tools grid + Recent Files | iLovePDF: tool grid; CamScanner: doc list first | Good & on par. Colourful icons diverge from the neutral auth/profile system (deliberate) | Low | Keep; ensure dark-mode of colour tiles is tuned | P3 |
| **Scan → PDF** | ML Kit auto edge/crop, multi-page, filters | Adobe/CamScanner: same, plus batch + auto-capture | Parity on core; no auto-shutter/batch-count UI | Med | Add auto-capture + running page count (already partially present) | P2 |
| **Tools discovery** | Tools tab grouped (Create/Organize/Optimize/Edit/OCR/Security) | iLovePDF: flat grid of tools | Clear grouping is a strength | — | Keep | — |
| **Login** | One-screen, Inter, identity+password, Google, legal | Adobe/CamScanner: standard account screens | Was scrolling (**fixed** — now fits one screen) | — | Done | — |
| **Empty states** | "No documents yet — tap scan" | Competitors: illustrated empty states | Functional but plain | Low | Add a friendly illustration/CTA | P3 |
| **Loading/OCR** | "running" stage shown | Adobe shows progress % | OCR long-run has no % / cancel | Med | Add progress + cancel for OCR/large exports | P2 |
| **Error states** | Friendly auth errors; export errors surfaced | Adobe/CamScanner: inline errors | Good on auth; verify tool errors aren't swallowed | Med | Ensure every tool surfaces failures (see BUG RISK-C) | P1 |
| **Feedback after action** | Save → navigates to Files | Competitors: toast + open | No success toast on tool completion | Low | Add a success toast/confirmation | P3 |
| **Destructive actions** | Delete has overflow menu (no confirm) | Competitors confirm/undo delete | No confirm/undo on delete | Med | Add confirm or undo-snackbar for Delete | P2 |
| **Dark mode** | Tokens defined | Adobe/CamScanner full dark | Colourful Home not fully dark-tuned | Low | Tune colour tiles + wordmark for dark | P3 |
| **Perceived trust** | Clean neutral system + real logo | Adobe brand trust is high | New brand, no reviews/installs yet | Med | Store reviews, ASO, privacy badges | P2 |

**Design strengths to protect:** one coherent design system (Inter, single accent for auth/profile), honest "not built yet" messaging (no fake features), fast scanner-first launch, no ads/clutter.
