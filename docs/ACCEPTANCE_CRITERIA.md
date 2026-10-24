# Phase 1 Acceptance Criteria

A feature is **done** only when every criterion has an automated test (unit, API or E2E) passing in CI. Real Supabase data only; no fictitious jobs, employers, applications or match %.

| Feature | Testable criteria |
|---|---|
| F1 Config | Six vars validated before start; missing names printed, values never; DEV/QA/PROD separated; PROD blocked on dev server; local→cloud fallback |
| F21 Design system | All text pairs ≥4.5:1; no dark backgrounds/dark mode; every page renders shared Nav; tokens used instead of hard-coded colors; components render at 390/768/1280px |
| F3 Auth & profile | Unauthenticated protected routes → `/login?next=`; `next` cannot redirect off-site; first login → onboarding; profile PUT uses session id, rejects invalid input (422), never returns other users' rows |
| F4 Job search & filters | Filters: keyword, country, city, remote/hybrid/onsite, salary min (+currency), seniority, employment type, industry; default country US; `WW` = no country filter; invalid params ignored safely; pagination; results only `is_active` real jobs; empty state when none |
| F22 Global location | Selector default US; pinned Worldwide, IN, CA, GB, AU, DE; all ISO countries; jobs keep original country/currency |
| F8 Saved jobs | Save/unsave own only (RLS); unique per user/job; list shows saved jobs |
| F5 Resumes & uploads | Multiple resumes per user; PDF/DOCX ≤5 MB; private bucket under `user_id/`; signed URL expiry; delete own only |
| F6 Ingestion | Only configured employer/ATS public APIs; provenance stored; admin auth required; malformed payload rejected |
| F7 Dedup & freshness | Same canonical job imported twice → one row; `last_seen_at` updated; unseen after N days → inactive |
| F9 Resume analysis | Extracted skills stored with model/version; failure leaves resume intact; no analysis shown without a real run |
| F10 Recommendations | Score computed from real profile/resume/job data; each result lists reasons; no % when inputs missing |
| F11/F23 Tailoring | Draft résumé/cover letter/answers per job; diff shown; nothing used until user approves |
| F12 Approval | State machine draft→ready→approved→submitted enforced server-side; approval snapshot immutable; duplicate (user, job) blocked |
| F24 Bulk prep | Batch prepared; submission only for items in an explicitly approved batch |
| F13 ATS submission | Only supported official APIs; otherwise `external_pending` + employer link; receipt stored only on confirmed success |
| F14/F25 Tracking | Status history recorded; recruiter response/interview stages; reminders scheduled; analytics counts match DB |
| F15 Notifications | In-app notifications for status changes/new matches; mark read; own only |
| F16 Admin | Role-based admin (not shared secret); non-admin 403 |
| F17 Dashboard | Shows discovery, real recommendations, queue, activity, progress; empty states when no data |
| F18 Branding | Original logo/copy; visual QA screenshots at 3 breakpoints per key page |
