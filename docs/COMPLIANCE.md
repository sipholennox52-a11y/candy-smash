# Compliance & App-Store Readiness

This document summarizes the compliance posture of **Candy Blast Saga** as implemented in
this repository, plus the store declarations an operator will need. It is a readiness aid,
**not legal advice** — entity names, jurisdictions, and store declarations must be reviewed by
the operator and, where money or personal data is involved, by qualified counsel.

## 1. What this build actually does

- Runs fully client-side (static web / Capacitor Android wrapper).
- No accounts, no backend, no network calls in the shipped game.
- No analytics, ads, cookies, or device identifiers.
- Progress stored only in on-device `localStorage` (`candyblast`, `candyblast_prefs`, `candyblast_welcomed`).
- In-app purchases are **simulated** — no money is charged and no payment data is collected.

Because there is no data collection or non-essential storage, **no cookie/consent banner is
required** for this build.

## 2. Google Play — Data Safety form (suggested answers)

| Question | Answer for this build |
|---|---|
| Does your app collect or share any user data? | **No** |
| Is all user data encrypted in transit? | N/A (no data leaves the device) |
| Do you provide a way to request data deletion? | Yes — in-app **Settings → Reset game data**, and OS-level clear data |
| Contains ads? | **No** |
| In-app purchases? | **Yes** (must be declared once real billing is enabled) |

> When real Google Play Billing is enabled, revisit this table: purchase tokens are processed by
> Google, not stored by the app, but the "in-app purchases" declaration must be set to Yes.

## 3. Apple — Privacy "nutrition label" (suggested)

- **Data Not Collected** for this build.
- When Apple IAP is enabled: declare **Purchases** under "Data Not Linked to You" only if you do
  not tie purchases to an identity; otherwise "Data Linked to You".

## 4. Suggested age rating

- **IARC / Google Play:** Everyone / PEGI 3 equivalent, with the **"In-game purchases"**
  interactive-elements flag once real billing is enabled.
- **Apple:** 4+ (no objectionable content), with the in-app-purchases disclosure.
- Content is non-violent, non-gambling. Note: match-3 with paid boosters is **not** gambling
  (no wagering, no randomized paid loot boxes). Do **not** add paid randomized rewards without
  re-reviewing gambling/loot-box rules (e.g. Belgium, Netherlands, China disclosure rules).

## 5. Children / age-appropriate design

- First-run notice discloses in-app purchases, no-data-collection, and asks under-18s to have
  parental permission.
- No personal data is collected, aligning with **COPPA** and the UK **Age Appropriate Design
  Code** for this build.
- The previous auto-resetting "limited time" sale countdown (a fake-urgency dark pattern) was
  **removed** to align with EU UCPD / Digital Fairness expectations and child-safety guidance.
- If the app is directed at children and you later add ads/analytics/accounts, you must add a
  neutral age gate, verifiable parental consent, and update the Privacy Policy.

## 6. Accessibility (WCAG 2.2 target: AA)

Implemented in this build:

- Keyboard-playable board (arrow keys + Space/Enter), visible focus indicators, skip link.
- Screen-reader announcements via an ARIA live region (cursor position, matches, score, moves,
  level result).
- ARIA roles/labels on controls, tabs (`role="tablist"`), progress bar, and dialogs
  (`role="dialog"`, `aria-modal`, labelled, focus-trapped, Escape-dismissible where allowed).
- Respect for `prefers-reduced-motion`, plus in-app **Reduce motion** and **High-contrast**
  toggles.
- Contrast improvements on previously low-contrast text.

Recommended before certifying conformance: a manual audit with a screen reader (NVDA/VoiceOver)
and an automated pass (axe/Lighthouse), documented in a VPAT/ACR if required.

## 7. Payments & consumer protection (future, not enabled here)

Before charging real money, the operator must implement the server-side pieces in `server/`
(see `server/README.md`) and provide provider credentials. Required for compliance:

- PCI-DSS: never handle raw card data in the client — delegate to Stripe/Play/Apple.
- Server-side receipt/signature verification before granting items (anti-fraud).
- Clear price, currency, and "you will be charged" confirmation before purchase.
- EU right of withdrawal / refund handling and a stated refund policy.
- Restore-purchases flow (Apple requirement) for non-consumables.

## 8. Not covered by this repository

Regulatory compliance depends on choices made outside the code: legal entity, jurisdiction(s),
hosting/data-residency, retention policy, DPA/subprocessor agreements, and legal review of the
Privacy Policy and Terms. This document does not certify compliance in any jurisdiction.
