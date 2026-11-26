# Security hardening — parallel review

Base of PR #29: 2f82221. Active Codex branch observed at 1ff637d. No production or database mutations; no new branch.

Implemented:
- bounded streamed UTF-8 JSON parser, real bytes rather than trusting Content-Length; rejects invalid media types; 16 mutation endpoints migrated including legacy CMS upload and marketing event ingestion.
- Origin syntax rejects userinfo, non-HTTP(S), paths and insecure production HTTP; local HTTP limited to existing localhost aliases. The deployment must still verify forwarded host trust at the proxy.
- Legacy CMS file extension derived from allowlisted MIME rather than supplied name; signed response no-store; legacy actual file validation/bucket enforcement remains necessary.
- Public portfolio hydration never signs private media, skips unauthorised assets, requires valid consent evidence and actual cover membership; invalid consent change unpublishes first; publication sets public status only after media preparation; failed deletion/reset is surfaced; new public copy TTL 60 seconds (cannot recall existing downloads/CDN cache).
- Disable obsolete direct-public upload repository method. Guard oversized images by Blob.size and 80 MP decoder limit for portfolio/delivery derivatives. Signed response no-store.
- Agenda checks relevant overlapping range and handles exclusion violation 23P01. Candidate SQL in docs/sql/CRISDAL_AGENDA_CONCURRENCY_CANDIDATE.sql is NOT installed. The existing read/write race remains until DB constraint is tested and installed. Candidate follows current single-resource overlap policy; verify business capacity before applying.
- Five bounded-body tests passed with Node 22; helper TypeScript strict passed in isolation. Exact original files checked by Git hashes 1722d0e240c6e20c74beb13b2d19d865a3edc429 and 8259fc44da2d818c3d9ee04c3b9b33dbac37ff7a; temporary test import suffix adapted. Added origin and cover membership regression tests, not executed in full app.

High-priority remaining gates:
1. Run full npm lint/typecheck/test/build/audit and browser QA on merged candidate; review concurrent changes in app/globals.css, availability repository and migration.
2. Backup/restore PostgreSQL and Storage before migrations. Test SQL candidate with two sessions and no destructive resolution of legacy overlaps. Use CLI to generate migration after validation; no remote SQL yet.
3. Portfolio publication and revocation are multi-step Storage + SQL operations, not atomic. Test partial upload, orphan cleanup, publication/revocation concurrency, shared legacy asset references, unlink and residual URLs. Do not promise immediate removal from browsers/CDNs/social sites. Require private delivery enablement to remain off until token/rate-limit/revocation/storage QA.
4. Implement atomic upload intent claiming and idempotent confirmation, retry cleanup, size verification at Storage boundary. Current image limits do not eliminate concurrent duplicate confirmations.
5. Review authenticated legacy CMS login throttling, all server action origins, no-store for sensitive successful reads, production rate limiting and monitoring; do not leak internal DB errors. Check actual deployed headers and RLS/role grants.
6. Preserve existing consent semantics and WhatsApp paths; verify public form/marketing body limits and valid clients. No real client data in fixtures.
7. Do not treat this targeted source review as exhaustive pentest or completed infrastructure activation.

Integrate PR #29 into PR #28 after QA; no separate release branch needed. 
