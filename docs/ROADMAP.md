# Tavishi Careers Roadmap

Prioritized by dependency → security → correctness → product value. Each feature is a branch + draft PR + GitHub issue, with acceptance tests. Status: ✅ done (awaiting merge approval) · 🚧 in progress · ⏳ planned · ⛔ blocked.

| # | Feature | Depends on | Status | Acceptance (testable) |
|---|---------|-----------|--------|------------------------|
| F1 | Infisical cloud configuration (PR #2) | – | ✅ | Six vars validated before start; missing names listed, never values; DEV/QA/PROD separate; local→cloud fallback; node:test suite |
| F2 | CI + roadmap + lint | F1 | 🚧 | GitHub Actions runs lint, typecheck, test, build on push/PR |
| F3 | Supabase SSR auth, Google OAuth, profile onboarding | F2 | 🚧 | Middleware refreshes session; protected routes redirect to /login; safe `next` redirect; profile validation tests; profile API upserts own row only |
| F4 | Worldwide job schema + search filters | F2 | ⏳ | Country, city, remote/hybrid/onsite, salary min/max+currency, seniority, employment type; filter parser unit tests; indexed queries |
| F5 | Multiple resumes + secure uploads | F3 | ⏳ | Private Storage bucket, per-user path RLS, MIME/size validation (PDF/DOCX ≤5 MB), signed URLs, delete own only |
| F6 | Authorized job ingestion (Greenhouse, Lever, Ashby public boards) | F4 | ⏳ | Only employer-published board APIs; source+provenance stored; admin-secret protected; no fabricated jobs |
| F7 | Deduplication + freshness tracking | F6 | ⏳ | Canonical hash (company+title+location+url); `first_seen_at`/`last_seen_at`; stale jobs deactivated; unit tests |
| F8 | Saved jobs | F3, F4 | ⏳ | `saved_jobs` table + RLS (currently referenced in UI but missing from migrations) |
| F9 | AI resume analysis | F5 | ⏳ | Extract skills/experience; results stored with model+version; needs AI provider approval (paid) |
| F10 | Explainable job recommendations | F7, F9 | ⏳ | Score + human-readable reasons per job; only real jobs/resumes; deterministic tests for scorer |
| F11 | Resume selection + tailored application drafts | F9 | ⏳ | Draft per job+resume; user-editable; never auto-sent |
| F12 | Explicit approval before submission | F11 | ⏳ | Immutable approval snapshot; state machine tests (draft→ready→approved→submitted) |
| F13 | Verified ATS submission integrations | F12 | ⏳ | Only where ATS offers a supported apply API; otherwise external_pending with apply link; needs owner approval for any real submission |
| F14 | Application tracking + analytics | F12 | ⏳ | Status history table; funnel metrics per user |
| F15 | Notifications | F7, F14 | ⏳ | In-app notifications (new matches, status changes); email later (may be paid) |
| F16 | Admin tools | F6 | ⏳ | Role-based admin (not shared secret); source management, ingestion logs |
| F17 | Responsive dashboards (reuse `feature/dashboard-ui`) | F14 | ⏳ | Mobile/desktop layouts; integrate preserved dashboard branch |
| F18 | Tsenta-inspired UI with original Tavishi branding | F17 | ⏳ | Design system (tokens, components); original logo/colors/copy; no copied assets |
| F19 | Health endpoint + monitoring | deployment | ⛔ | `/api/health` (no secrets); uptime checks + alerts once a public staging URL exists |
| F20 | Staging deployment | owner approval | ⛔ | Requires approval (hosting, possibly paid) |
