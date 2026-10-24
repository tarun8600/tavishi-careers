# Tavishi Careers Roadmap

Status: ✅ done (awaiting merge approval) · 🚧 in progress · ⏳ planned · ⛔ blocked. Acceptance criteria: docs/ACCEPTANCE_CRITERIA.md. Order within a phase is build order.


## Phase 1 — Complete website (all user-facing features)

| # | Feature | Depends on | Status | Acceptance (summary) |
|---|---|---|---|---|
| F1 | Infisical cloud configuration (PR #2) | – | ✅ | Six vars validated before start; missing names listed, never values; DEV/QA/PROD separate; local→cloud fallback; node:test suite |
| F21 | Design-system foundation (Tavishi Aurora Light tokens + shared components app-wide) — see DESIGN_SPEC.md | F1 | ✅ | Tokens in CSS; components in `src/components/ui`; all pages use layout/nav; contrast tests |
| F3 | Supabase SSR auth, Google OAuth, profile onboarding | F2 | ✅ | Middleware refreshes session; protected routes redirect to /login; safe `next` redirect; profile validation tests; profile API upserts own row only |
| F4 | Worldwide job schema + search filters | F2 | 🚧 | Country, city, remote/hybrid/onsite, salary min/max+currency, seniority, employment type; filter parser unit tests; indexed queries |
| F22 | Global location: country selector (default US; Worldwide, IN, CA, GB, AU, DE, all ISO), international records preserved | F4 | 🚧 | Country list + default unit tests; jobs keep original country/currency |
| F8 | Saved jobs | F3, F4 | ⏳ | `saved_jobs` table + RLS (currently referenced in UI but missing from migrations) |
| F5 | Multiple resumes + secure uploads | F3 | ⏳ | Private Storage bucket, per-user path RLS, MIME/size validation (PDF/DOCX ≤5 MB), signed URLs, delete own only |
| F6 | Authorized job ingestion (Greenhouse, Lever, Ashby public boards) | F4 | ⏳ | Only employer-published board APIs; source+provenance stored; admin-secret protected; no fabricated jobs |
| F7 | Deduplication + freshness tracking | F6 | ⏳ | Canonical hash (company+title+location+url); `first_seen_at`/`last_seen_at`; stale jobs deactivated; unit tests |
| F9 | AI resume analysis | F5 | ⏳ | Extract skills/experience; results stored with model+version; needs AI provider approval (paid) |
| F10 | Explainable job recommendations | F7, F9 | ⏳ | Score + human-readable reasons per job; only real jobs/resumes; deterministic tests for scorer |
| F11 | Resume selection + tailored application drafts | F9 | ⏳ | Draft per job+resume; user-editable; never auto-sent |
| F23 | AI tailoring, cover letters, question drafting, résumé change diff/review | F11 | ⏳ | Diff renderer tests; nothing used until user approves |
| F12 | Explicit approval before submission | F11 | ⏳ | Immutable approval snapshot; state machine tests (draft→ready→approved→submitted) |
| F24 | Bulk preparation with per-submission or approved-batch authorization | F12 | ⏳ | Batch approval record; no submission outside approved set |
| F13 | Verified ATS submission integrations | F12 | ⏳ | Only where ATS offers a supported apply API; otherwise external_pending with apply link; needs owner approval for any real submission |
| F14 | Application tracking + analytics | F12 | ⏳ | Status history table; funnel metrics per user |
| F25 | Recruiter responses, interview status, follow-up reminders | F14 | ⏳ | Status history + reminder scheduling tests |
| F15 | Notifications | F7, F14 | ⏳ | In-app notifications (new matches, status changes); email later (may be paid) |
| F16 | Admin tools | F6 | ⏳ | Role-based admin (not shared secret); source management, ingestion logs |
| F17 | Responsive dashboards (reuse `feature/dashboard-ui`) | F14 | ⏳ | Mobile/desktop layouts; integrate preserved dashboard branch |
| F18 | Tsenta-inspired UI with original Tavishi branding | F17 | ⏳ | Design system (tokens, components); original logo/colors/copy; no copied assets |


## Phase 2 — Full QA and security

| # | Feature | Depends on | Status | Acceptance (summary) |
|---|---|---|---|---|
| F2 | CI + roadmap + lint | F1 | 🚧 | GitHub Actions runs lint, typecheck, test, build on push/PR |

Also in Phase 2: end-to-end tests (Playwright) for every Phase 1 flow, RLS policy tests against a local Supabase, dependency audit, secret scanning, OWASP review, accessibility audit.


## Phase 3 — DEV / QA / PROD environments and pipeline (deploy only with owner approval)

| # | Feature | Depends on | Status | Acceptance (summary) |
|---|---|---|---|---|
| F20 | Staging deployment | owner approval | ⛔ | Requires approval (hosting, possibly paid) |

Also in Phase 3: Infisical DEV/QA/PROD wiring in CI, preview deploys, migration pipeline with manual approval gate.


## Phase 4 — Monitoring (only after a live deploy) and future integrations

| # | Feature | Depends on | Status | Acceptance (summary) |
|---|---|---|---|---|
| F19 | Health endpoint + monitoring | deployment | ⛔ | `/api/health` (no secrets); uptime checks + alerts once a public staging URL exists |
| F26 | Future integrations: email (optional, drafts only), browser extension, mobile, agent/MCP | F13 | ⏳ | Separate designs; owner approval per integration |

## Permanent requirements (owner, 2026-10-24)
- Functional parity targets: docs/FEATURE_PARITY.md. Original light-only design: docs/DESIGN_SPEC.md (do not copy Tsenta).
- Worldwide; default country United States; all industries, levels and arrangements; preserve international records.
- Real Supabase data only; never fictitious jobs, employers, applications or match %. Never claim a capability works until built and tested.
- Order: Phase 1 complete website first; monitoring only after a live deploy (owner priority, 2026-10-24).
