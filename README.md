# Kingdom 2312 community hub

A Next.js App Router application with React, Tailwind CSS, Supabase, and a dark metallic-gold design. Intended hosting: Vercel.

## What is implemented

- Home and alliance schedules for 404, 401, FXF, BLO, OMG, and GLX.
- Direct navigation to Player Profile, Member Forms, KvK Battle, KvK Prep, Game Guides, Upgrade Tools, and Kingdom Timeline.
- Open account registration, member-ID/password sign-in, no-email registration, admin-assisted password recovery, and sign-out.
- Saved profiles, battle availability, and prep forms. Profiles belong to the signed-in account; administrators can review submitted forms.
- One searchable Gen 1–2 hero list, with the kingdom’s 4-star + level-5-skill qualification rule.
- Searchable Governor Gear choices through Red / Legendary T6, 3 stars; charms through level 22.
- No Total Power, troop counts, or transfer-status question in the profile. No pet or event-shop planners.
- KvK availability from 10:00–22:00 UTC, a clearly marked 12:00–17:00 castle window, half-hour start/end selections, and validation.
- K710-inspired four-column prep: Days 1, 2, 4, and 5. Speedups stay in days; UTC slots are requests, not automatic bookings.
- Real inventory-based Governor Gear, charm, and construction calculations: affordable reach, costs, leftovers, target shortfalls, next-step requirements, and an upgrade path.
- Searchable game/kingdom guides with source links. Kingdom Timeline links to the live 2312-specific Kingshot Optimizer page and shows leadership-confirmed progression.
- Transfer buttons open the Kingdom 2312 application at `/join`, stored in this site’s Supabase database and reviewed by kingdom admins.
- A protected administration area for member submissions, website transfer applications, events, and gallery uploads/publication/deletion.
- Row-level database policies, private gallery storage, server-side validation, origin checks, and shared rate limits.

The source is implemented and builds locally. **It is not publicly deployed or connected to a live Supabase project.** Until configuration is supplied, member forms can be checked locally but do not save. Account and admin operations remain unavailable. This is an explicit connection state, not a simulated successful submission.

## Run locally

Use Node.js 24.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Public pages and calculations work without Supabase settings.

```bash
npm test
npm run typecheck
npm run build
node scripts/check-routes.cjs
npm start
```

## Transfer applications

All transfer buttons now open `/join`, an original Kingdom 2312 form. Visitors do not need an account. Applications are validated, rate limited, stored in Supabase, and reviewed under Admin → Transfers. No answers are sent to another kingdom or Google Forms.

## Registration without an alliance

Apply `supabase/migrations/002_optional_registration_alliance.sql` after migration 001, including on existing projects. This only allows a member's alliance to remain unassigned; it preserves existing records. Registration asks for member ID, player name, password, and privacy consent. Transfer applicants may choose a destination alliance or No preference. Members can still provide their alliance later in their player profile.

## Connect Supabase

1. Create a Supabase project for this website.
2. Run `supabase/migrations/001_kingdom_hub.sql` in its SQL editor, or apply it through the Supabase CLI. This migration is for a new project; do not rerun it over an existing schema without a reviewed migration.
3. Fill in `.env.local` using `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`: project URL.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: public/publishable key.
   - `SUPABASE_SERVICE_ROLE_KEY`: server-only service-role key. Never prefix it with `NEXT_PUBLIC_`.
   - `NEXT_PUBLIC_SITE_URL`: the complete website origin, without a path.
   - `RATE_LIMIT_SALT`: at least 32 random characters. Generate locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
   - `NEXT_PUBLIC_SUPPORT_URL`: optional HTTPS donation destination.
4. Keep the Supabase Email authentication provider enabled: the server uses it internally with a reserved, non-deliverable identifier. Members do not enter email addresses. No SMTP or email templates are required.
5. Keep email confirmations enabled for ordinary direct Supabase signup. The website's rate-limited server creates confirmed internal accounts through the admin API; it never sends email.
6. In Supabase Auth URL settings, set the Site URL to the website origin.
7. Restart after environment changes. Create your member account through `/account`; registration signs the new member in immediately.
8. Existing member IDs and passwords are preserved. Previously unconfirmed legacy accounts need owner assistance; never delete an account to recreate it.
9. Grant your account administration access from the Supabase SQL editor:

```sql
insert into public.admin_roles (user_id)
select id from public.members where player_id = 'YOUR_MEMBER_ID';
```

Administrator access is stored in a protected table. Registration metadata and profile fields cannot grant the role. A member ID is the website username, not proof of ownership of an in-game account; leadership handles disputed IDs.

## Deploy on Vercel

1. Put this project in a Git repository and import it into Vercel.
2. Select the Next.js framework preset and Node.js 24. Use `npm run build`; keep the default output directory. This application requires server routes and is not a static export.
3. Add the same Supabase settings and server-only secrets to Vercel. Set `NEXT_PUBLIC_SITE_URL` to your final HTTPS domain. Scope preview deployments to a separate test Supabase project when testing account changes.
4. Add the final domain to the Supabase Auth settings and set the Site URL.
5. Deploy. Environment changes require a fresh deployment.
6. On the deployed site, verify registration without email, sign-in, saving/reloading all three forms, and password recovery. Use two test member accounts to verify isolation and an explicitly authorized admin account to review submissions, publish an event, and upload an image.
7. Verify desktop and phone layouts, keyboard navigation, gallery lightbox controls, and screen-reader labels before sharing the site with the kingdom.

No production credentials are included in the source.

## Data, privacy, and administration

Members read and write their own forms. Kingdom administrators can read submitted forms; public visitors cannot. Profile identity is synchronized from a saved profile without changing the account’s member ID. Battle and prep forms are stored per member and battle date; the most recently updated form is loaded when reopening a page.

The gallery bucket is private. Published gallery records allow signed image URLs that last ten minutes; previously issued URLs can remain valid until they expire after an image is unpublished. Uploads accept JPEG, PNG, or WebP files up to 4 MB, with server-side file-signature checks.

The rate limiter allows 30 attempts per operation/IP-derived bucket per 15-minute window. It stores a salted hash, not the raw address, and removes expired buckets. Production client-IP handling assumes Vercel; other hosts must provide a trusted IP source before opening forms broadly.

A profile never grants game access or verifies hero ownership. Members declare that selected heroes meet the qualification rule. Minister availability requests require leadership approval outside the form.

## Editable content and game data

- Navigation, alliances, and confirmed Bear Trap times: `data/kingdom.ts`.
- Transfer application destination: `data/transfers.ts`.
- Kingdom limits: `data/progression.ts` — Gen 2, TG3, T10. Do not automatically unlock progression from predictions on an external timeline.
- Hero roster: `data/heroes.ts`.
- Gear/charm profile choices: `data/equipment.ts`.
- Costs: `data/gear-costs.json`, `data/charm-costs.json`, `data/building-costs.json`.
- Research references and disputed costs: `data/upgrade-data.ts` and `RESEARCH-NOTES.md`.
- Battle windows and official references: `data/battle.ts`.
- Prep slots: `data/prep.ts`.
- Game/kingdom guides: `data/game-guides.ts` and `data/guides.ts`.
- External kingdom timeline: `data/timeline.ts`.

The equipment maximums are the full published game ranges. Kingdom unlocks may lag. Construction is restricted to TG3. Community cost tables can differ and contain rounded values; the planner identifies disagreements and supports in-game cost overrides. Building estimates exclude prerequisite upgrade costs and show the prerequisites separately. No unverified kingdom unlock dates or battle results are invented.

## Validation and remaining live checks

`npm test` covers calculation boundaries, inventory bottlenecks, quantities, TG substeps, days, form constraints, registration validation, and database policies. The database test executes the actual migration in an isolated PostgreSQL-compatible PGlite instance, with minimal Auth/Storage table stubs. It verifies ownership, cross-member denial, administrator-role protection, public/private content, storage access, and rate limits. It does not replace testing against the actual Supabase project.

The preview interaction check uses DOM emulation:

```bash
node --import tsx scripts/render-upgrade-preview.tsx ./preview.html
node scripts/check-preview.cjs ./preview.html
```

It exercises the battle presets, invalid-window reset, profile removals, hero search/selection, prep slots, live calculations, guide search, and kingdom-specific timeline link. This presentation uses local-only adapters; it never submits or saves information. The actual Next.js application uses the authenticated API routes.

A real browser could not access the execution workspace’s local server in this session. Desktop/mobile visual QA, live account registration, live Storage, and deployed end-to-end saving must still be checked after connection. No live deployment or production account test is claimed.

## No-email account recovery
Members contact leadership in-game. An authorized admin can use the password-reset section at `/admin` after verifying identity. Set a new temporary password and share it privately in-game; the member should change it at `/account/password`. Do not put passwords in chat screenshots, SQL queries, or source files. Administrator accounts are excluded from this tool and must be recovered by the Supabase project owner with the server-side Auth Admin API. Existing access tokens may remain valid until expiry after a reset.

Registration internally assigns `member-PLAYER_ID@members.kingdom2312.invalid`. This is an authentication identifier, not a mailbox, and does not verify in-game ownership. Public member registration remains open; leadership handles disputed IDs. Duplicate IDs cannot overwrite existing accounts because of the database unique constraint. No database migration is needed for this change. Do not rerun migration 001 on your existing database.


## Five-step transfer applications
Apply migration 003_transfer_application.sql before deploying the five-step form. This adds details and evidence_paths columns and a private transfer-evidence bucket. Existing applications remain readable.

The form covers identity, desired transfer month/alliance and UTC schedule, Gen 2/TG3/T10 progression, event/KvK commitment, and 1–4 screenshots. It excludes total power, troop counts, Master power, T11, later Truegold levels, and Truegold Dust. Intake months express applicant preference and are not scheduled transfer windows.

Screenshots accept JPEG/PNG/WebP up to 750,000 bytes each; the complete multipart request is bounded at 3.2 MB. The server checks signatures and sizes, generates paths, and stores only private files. Admin review issues signed links lasting ten minutes. Anonymous and ordinary member reads are denied by storage policies. Failed inserts trigger best-effort uploaded-file cleanup. Hosting failures can leave orphan files; the project owner can remove these from the private bucket. Never make the bucket public.
