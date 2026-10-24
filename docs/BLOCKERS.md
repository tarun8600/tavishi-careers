# Blockers & Decisions Needing Owner Approval

| ID | Item | Needs | Status |
|----|------|-------|--------|
| B1 | Merge PR #2 (F1) and subsequent PRs into `main` | Owner merge approval | Open |
| B2 | Branch protection on `main` (require PR + CI) | Owner approval (access-control change) | Open |
| B3 | Apply migrations (002+) to live Supabase | Owner approval; non-destructive files only are committed | Open |
| B4 | AI provider for resume analysis (paid API) | Owner approval + key added to Infisical by owner | Open |
| B5 | Staging/production hosting + deployment | Owner approval (possibly paid) | Open |
| B6 | Google OAuth redirect URLs for staging/prod in Supabase + Google Cloud | Owner configuration | Open |
| B7 | Credential rotation | Any previously exposed credential must be rotated by owner. Git history scan 2026-10-24 found none committed; rotate if shared elsewhere (chat, screenshots) | Monitoring |
| B8 | PR #1 (Keerthan) adds `.idea/` and removes lockfile entries | Owner/Keerthan decision | Open |
| B9 | Real Windows PowerShell + live Infisical test of F1 | Owner run on laptop | Open |
