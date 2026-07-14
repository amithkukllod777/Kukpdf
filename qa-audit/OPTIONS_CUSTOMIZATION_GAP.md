# KukPDF — Options & Customization Gap

| Option | KukPDF | Competitors | Gap | Target user | Value | Complexity | Recommendation |
|---|---|---|---|---|---|---|---|
| Default scan filter / colour mode | Filters at capture | CamScanner/Adobe: default + per-doc | No persistent default | Frequent scanners | Med | S | Add a default-filter setting |
| Default page size (A4/Letter) | Fixed by image | iLovePDF: choose | No page-size control on Image→PDF | SMB/legal | Med | M | Add A4/Letter/Fit option |
| Export/compress quality | Compress = one level | Competitors: low/med/high | Single compression level | Everyone | Med | S | Add quality slider |
| File naming pattern | Auto `Tool YYYY-MM-DD` | Some allow templates | No custom naming/prefix | Power users | Low | S | Add rename-on-save + optional prefix |
| Language (app UI) | English only | CamScanner: Hindi/Bengali/Tamil UI | No app-UI localization | India users | High | M | Add Hindi UI (i18n) — aligns with Hindi-OCR wedge |
| OCR language default | Choose per run (Eng/Hin/both) | Premium-gated on rivals | Good (free) | India users | — | — | Keep; add more Indian scripts |
| Theme (dark/light) | System tokens defined | Full dark on rivals | Not user-toggleable in UI | Everyone | Low | S | Add explicit theme toggle |
| Cloud sync on/off + Wi-Fi-only | Manual + auto on login/resume | Cloud-centric rivals | No "sync on Wi-Fi only" / auto-sync toggle | Data-conscious | Med | S | Add sync preferences (off / Wi-Fi only / always) |
| Storage location / SD | App IndexedDB only | Some allow SD/Drive | No external storage target | Low-storage devices | Low | M | Consider export-to-Drive later |
| Notification prefs | None (no notifications) | Rivals: reminders | No notification system | — | Low | M | Only if a real need emerges (avoid overbuild) |
| Account deletion / data export | Not in-app | Required by Play/GDPR | **Missing self-serve delete/export** | All (compliance) | High | M | **Add "Delete account" + "Export my data"** (Play Data-safety expects it) |

**Priority picks:** (1) **Account deletion + data export** (compliance, P1), (2) **Hindi app UI** (market wedge, P2), (3) **compression quality + page size** (parity, P2), (4) **sync preferences** (P2). Avoid credit systems / storage tiers (would erode the free-and-private positioning).
