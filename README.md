# Kingdom 2312 community hub

A Next.js App Router application with React, Tailwind CSS, Supabase, and a dark metallic-gold design. Intended hosting: Vercel.

## What is implemented

- Home and alliance schedules for 404, 401, FXF, BLO, OMG, and GLX.
- Direct navigation to Player Profile, Member Forms, KvK Battle, KvK Prep, Game Guides, Upgrade Tools, and Kingdom Timeline.
- Open account registration, member-ID/password sign-in, email verification, password recovery, and sign-out.
- Saved profiles, battle availability, and prep forms. Profiles belong to the signed-in account; administrators can review submitted forms.
- One searchable Gen 1–2 hero list, with the kingdom’s 4-star + level-5-skill qualification rule.
- Searchable Governor Gear choices through Red / Legendary T6, 3 stars; charms through level 22.
- No Total Power, troop counts, or transfer-status question in the profile. No pet or event-shop planners.
- KvK availability from 10:00–22:00 UTC, a clearly marked 12:00–17:00 castle window, half-hour start/end selections, and validation.
- K710-inspired four-column prep: Days 1, 2, 4, and 5. Speedups stay in days; UTC slots are requests, not automatic bookings.
- Real inventory-based Governor Gear, charm, and construction calculations: affordable reach, costs, leftovers, target shortfalls, next-step requirements, and an upgrade path.
- Searchable game/kingdom guides with source links. Kingdom Timeline links to the live 2312-specific Kingshot Optimizer page and shows leadership-confirmed progression.
- Transfer buttons open the supplied Google Form in a new tab, with an accessible external-link label and Google sign-in notice. `/join` includes the form link and transfer requirements.
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

## Transfer application link

The Transfer navigation item, home-page application buttons, transfer cards/banners, and alliance application buttons open:

https://docs.google.com/forms/d/e/1FAIpQLScuFJOddEfslPCGMfBoHtIcoJ-pR6M_t9sy9jMwgF7Eg97jtQ/viewform

Change the destination in `data/transfers.ts`. Google sign-in was required when opening this link; the form’s questions and owner were not visible without signing in. The website links to the exact supplied form and does not duplicate its questions or change its sharing settings. Linking works without Supabase configuration.

Responses remain in the form owner’s Google Forms account; they are not synchronized into the website admin area. Set `transferSettings.formUrl` to `null` to restore the built-in Supabase-backed form after connecting the database. Set `kingdom.transfersOpen` to `false` in `data/kingdom.ts` to pause application links on this website; closing the Google Form itself must be done by its owner.

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
4. Enable email/password authentication and email confirmations. Registration is open; invitations are not required. Set up production SMTP for reliable verification and password-reset emails.
5. In Supabase Auth URL settings, set the Site URL to the website origin and allow `/auth/callback` redirect URLs for your local and production origins.
6. Configure the confirmation email link to:
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
7. Configure the password recovery email link to:
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`
8. Restart the development server after changing environment variables. Create your member account through `/account` and confirm the email.
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
4. Add the final domain to the Supabase Auth settings and update the Site URL used by email templates.
5. Deploy. Environment changes require a fresh deployment.
6. On the deployed site, verify registration, confirmation, sign-in, saving/reloading all three forms, and password recovery. Use two test member accounts to verify isolation and an explicitly authorized admin account to review submissions, publish an event, and upload an image.
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

A real browser could not access the execution workspace’s local server in this session. Desktop/mobile visual QA, actual email delivery, Auth callbacks, live Storage, and deployed end-to-end saving must still be checked after connection. No live deployment or production account test is claimed.
