# Crisdal — commercial and operational polish / online app foundation

Scope: continue in existing PR #29. No new branch, remote migrations, DB changes, deployment, real client photos or private delivery activation. Codex owns backup/restore and critical Storage/permission QA.

## Commercial
- Inquiry context helpers preserve public event category and selected project/package reference in editable message, without copying contact form fields to the URL. Public project title is already authorized public content; treat context as untrusted input and never as a price/reservation.
- From portfolio detail and event packages, go directly to date inquiry with context. Keep WhatsApp as alternate. Public shell and coverage WhatsApp links do not redirect away to /gracias, preserving the browsing journey.
- Calendar retry, explicit validation on submit, in-flight guard and disabled controls while submitting. No fabricated availability. Phone from canonical publicSite.brand.whatsapp.
- Coverage shared cards now have primary date action and secondary WhatsApp, stable spacing and responsive rules.
- Event-first root metadata; published portfolio URLs included in dynamic sitemap. Individual project share metadata uses public cover or brand image; private panel, deliveries and share links excluded from crawl. robots.txt is not authorization. Verify noindex and signed URL behavior separately.
- No new photos or portfolio entries added; owner must publish genuine authorized projects.

## Operations
- Global server-side filters before pagination: clients (due followups/new/negotiating/active), quotes (draft/sent valid/expired/accepted/rejected), production (open/overdue/today/unassigned/delivered). Dates in America/Lima. UI deadline labels and explicit responsible person.
- Quote client lookup searches entire directory by name via authorized existing operations endpoint, up to 30 matches per search; selected client persists. Quote copyable text includes services, taxes explicitly entered, global discount, total, validity, terms and version; no acceptance reference or payment claim. Draft warning; not PDF or signed quote.
- Production task suggestions per stage, explicitly prefill only, no automatic insert or duplicate batch. User chooses due date and staff then saves. Existing tasks remain canonical.
- Finance CSV export: current month's real summary, global receivable balance, or current page of accounts/movements/vouchers, one currency per export. Numeric money fields not formulas; text formula prefix neutralization; separate boletas from cash; exclude separate customer-name and tax ID columns (free-text descriptions can still contain sensitive information). Explicit scope and filename. Not a full data backup or SUNAT export. Fast actions prioritize receipts, expense and voucher; guarded submission.
- No new schema requirements in commercial/operational changes; reuse existing APIs and persistence.

## Online app foundation
- Panel layout links /crisdal-os.webmanifest with app ID /panel, start /panel, standalone display, 192 and 512 square PNG icons derived from existing symbol, shortcuts to agenda/clients/finance.
- One codebase, existing server sessions/roles and Supabase; no Electron/Tauri, no service worker, no offline financial cache, no stored PII or offline mutation queue. Manifest is foundation, not browser installation certification. Verify Chrome/Edge Windows install, login/logout, shortcuts and app scope before announcing availability. If later native device integrations genuinely needed, evaluate a wrapper separately.
- References: https://nextjs.org/docs/app/guides/progressive-web-apps ; https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable

## QA performed / limits
- Node 22 isolated: 6/6 tests passed (2 CSV, 2 context, 2 operational filters/deadlines). Exact copies of helper files verified by git blob hashes: export 19395e9dbe0206c3f6f40db3c980828ba6904d9d, context 8b616376bcb0b1ae5208c16721267e1e873739e2, filters 00c84161b10f96abed877e482234a17b2f33d8a6. CSV/context test files verified; temporary import suffixes adapted and public-calendar dependency reduced to exact EVENT_TYPES constant for context tests. These are isolated logic tests, NOT full Next/Supabase integration.
- Three test files committed. Icons generated at exact dimensions, but browser install and decode/render need final QA. Full lint/tsc/npm test/build/audit, responsive UI in real app, real DB and end-to-end tests still pending. Earlier isolated QA is not proof of these new UI changes.
- Validate actual filters and counts with >50 rows and lookup after 200 clients; expired quote behavior and query authorization; no duplicate actions on retries; task template saves once; public calendar failure and successful submission; no PII in URL except already-public project title if chosen; CSV escaping, currency and scope; metadata, sitemap, noindex and PWA install.
- Future operational scope intentionally deferred: payment installment due-date schedule, committed costs/economic profit, PDF quote and revocable link, role-scoped dashboard queue, notifications, complete server-side report export, resource capacity, real portfolio first upload. No fabricated amounts or bookings.
- Reconcile against current PR #28 before merge; retain Codex's later changes. Read docs/CRISDAL_SECURITY_HARDENING.md and complete critical gates. Keep private delivery flag off. No SQL from this phase.
