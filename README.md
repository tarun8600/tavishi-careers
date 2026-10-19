# Tavishi Careers — starter prototype

A minimal Next.js demo with a homepage, sample job listings and a read-only job API. **Not a production job platform.** No authentication, AI, resume upload or application submission is implemented yet.

## Run
1. Install Node.js 20.9+.
2. Run `npm install`.
3. Run `npm run dev`.
4. Visit http://localhost:3000 and http://localhost:3000/jobs.
5. Query `/api/jobs?query=SOC` for a filtered sample.

## Database
The `supabase/migrations/001_core.sql` migration is an initial schema. Apply only in a development Supabase project. It enables RLS on all tables but is not a complete production permission model. Before adding uploads, configure private storage buckets and ownership policies. Do not expose a service-role key in the browser.

## Next milestones
- Supabase SSR authentication, email verification and profile onboarding.
- Private resume uploads with file validation, malware scanning and deletion.
- Licensed job ingestion, deduplication, freshness/expiry and attribution.
- Server-side AI matching with explanations and cost/rate limits.
- Immutable application draft revisions and explicit user approval.
- Authorized ATS adapters with idempotency keys and submission receipts.
- Integration, RLS, accessibility and security tests before launch.
