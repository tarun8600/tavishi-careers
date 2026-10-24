# Feature Parity: Tsenta (functional reference) vs Tavishi Careers

Source: public marketing page https://tsenta.com/ (read 2026-10-24). https://dashboard.tsenta.com requires sign-in, so only publicly described capabilities are listed. **Functional reference only — no Tsenta layouts, copy, icons, CSS or assets are reused** (see DESIGN_SPEC.md).

Status legend — **none**: not built · **partial**: some code exists, not complete or not tested · **done**: built *and* covered by automated tests. A row may only be marked *done* when tests exist in `tests/` and pass in CI.

| Area | Tsenta public capability | Tavishi status | Evidence / notes | Roadmap |
|------|--------------------------|----------------|------------------|---------|
| Discovery | Watches many employer career pages / ATSes (Workday, Greenhouse, Lever, Ashby…) | partial | Admin Greenhouse importer route exists; no tests, single board | F6 |
| Discovery | Freshness / "first to apply" alerts on new roles | none | No `first_seen_at`/`last_seen_at` | F7, F15 |
| Search | Filters: location, salary, experience level, role family | partial | `/api/jobs` text + location only; no structured fields | F4 |
| Search | Worldwide, country default (US) + switcher | none | Schema has free-text `location` only | F22 |
| Search | Paste a job URL to add a role | none | – | F6 |
| Saved | Saved jobs | partial | UI references `saved_jobs`; table missing from migrations; untested | F8 |
| Matching | Match score with explanation | none | No scorer. Never show a % without a real computed basis | F10 |
| Resumes | Multiple resumes / profiles per career path | partial | `resumes` table + RLS; upload flow untested | F5 |
| Career profile | Profile, preferences, work authorization | partial | Onboarding + `/api/profile` (validation tests, PR #23); no work-auth/sponsorship fields | F3, F22 |
| Tailoring | Per-role tailored résumé from job description | none | Needs AI provider approval (B4) | F11, F23 |
| Tailoring | Cover letters | none | – | F23 |
| Tailoring | Open-ended application-question drafting | none | – | F23 |
| Review | Diff/review of proposed résumé changes, approve before use | none | – | F23 |
| Approval | Approval queue (Ready / Needs you / Failed / Skipped) | partial | `applications` status enum + approve route; untested | F12 |
| Bulk | Bulk preparation with authorization | none | Must be per-submission or explicit approved batch | F24 |
| Submission | Submission via supported ATS | none | Only official apply APIs; otherwise external link (`external_pending`) | F13 |
| Receipts | Submission receipt (fields, answers, résumé, confirmation) | none | Immutable snapshot planned | F12, F13 |
| Duplicates | Duplicate-application prevention | none | Unique (user_id, job_id) planned | F12 |
| Tracking | Pipeline, status history | partial | Applications page exists; no history table | F14 |
| Tracking | Recruiter replies, interviews, rejections routed | none | Requires optional email integration | F25, F26 |
| Tracking | Follow-up reminders | none | – | F25 |
| Dashboard | Dashboard (discovery, queue, activity) | partial | `/dashboard` + preserved `feature/dashboard-ui` | F17 |
| Notifications | Notification center | none | – | F15 |
| Analytics | Application analytics | none | – | F14 |
| Admin | Source management, ingestion logs | partial | Shared-secret import route | F16 |
| Integrations | Email inbox connection (optional, drafts only) | none | Future | F26 |
| Integrations | Browser extension autofill | none | Future | F26 |
| Integrations | Messaging/mobile channel | none | Future | F26 |
| Integrations | MCP server / CLI for agents | none | Future | F26 |
| Billing | Credit/volume-based plans | out of scope | Spending/paid services need owner approval | – |

## Tavishi principles that differ by design
- Explicit user approval before every real submission (or a clearly defined approved batch); no "hands-off" default.
- Real Supabase data only: no demo employers, applications or match percentages shown as real.
- Worldwide by default with United States as the initial country.
