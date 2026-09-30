# Member form research — 30 September 2026

Kingdom-confirmed limits: Generation 2 heroes, TG3, no Truegold Dust, no Tempered Truegold, no Master Power. Hero selection is a member declaration of at least 4 stars and a level-5 skill; this is a kingdom rule, not a claim that the website verifies game accounts.

Community references checked:
- https://kingshot.net/database/governor-gear — gear color/tier and star progression.
- https://ks-toolkit.com/data/gear/governor-gear/ — six slots: coat/pants infantry, cap/watch cavalry, belt/weapon archers.
- https://kingshot.net/database/governor-charm — numbered charm levels (includes later levels up to 22).
- https://www.kingshotcalculator.net/governor-charm-calculator — older/early reference with levels through 11.

These are community resources, not official developer documentation. At the user’s request, equipment dropdowns now cover the complete published game range: Governor Gear through Red T6, 3 stars (58 paid steps), and charms through level 22. This does not claim those late tiers have unlocked in Kingdom 2312. Hero, troop, and building limits remain Gen 2, T10, and TG3.

The equipment cost data follows the matching tables at https://kingshot.net/database/governor-gear and https://kingshottips.com/gear/governor-gear, plus https://kingshot.net/database/governor-charm. Kingshot Data differs at Gold T2 zero stars and several high Red tiers and lists one fewer final step. Conflicting rows are flagged in `data/upgrade-data.ts`; users can override any base cost from their in-game screen. Do not describe these community tables as official or guaranteed exact.

Construction data: https://kingshotdata.com/buildings/town-center/, /embassy/, /barracks/, /stable/, and /range/. Each has level 1–30 and five paid substeps per TG tier through TG3. Source resource amounts are rounded, so results are estimates. The planner calculates one building, lists prerequisite requirements, and explicitly excludes prerequisite upgrade costs. Speedup budgets stay in days; time is divided by 1 + construction speed percentage / 100. Resource discounts affect basic resources only. Alliance helps and one-off timer reductions are excluded.

`lib/reach-calculator.ts` computes sequential affordability against all constrained materials without charging the already-owned level. Identical-item plans multiply every step by the item count and advance the group together. Tests cover exact budgets, bottlenecks, quantities, intermediate TG steps, days, modifiers, maxima, and invalid inputs.

Guides now have Game / Kingdom collections. Game guides are original summaries with linked sources and related planner links. Further sources include https://kingshotoptimizer.com/guides/kingshot-governor-gear-charms-guide/, https://kingshotdata.com/heroes/generation-2-heroes/, and the early expedition and Bear Hunt guides at kingshotguides.com.


Member hub: `/members`. Profile: `/members/profile`. Battle availability: `/members/availability`. Prep: `/members/prep`.

KvK battle dates are entered by members from leadership’s announcement. The time window is 10:00–22:00 UTC, with castle battle 12:00–17:00 UTC. The official Help Center confirms a 10:00 UTC start and 12-hour duration split into two hours, five castle hours, then five hours: https://centurygames.helpshift.com/hc/en/140-kingshot/faq/8356-what-is-the-time-and-duration-of-the-preparation-phase-and-battle-phase/ and https://centurygames.helpshift.com/hc/en/140-kingshot/faq/8353-how-is-the-12-hour-battle-phase-scheduled/. The 12:00–17:00 castle window is calculated from that official schedule. The UI offers 30-minute start/end selections and full-battle/castle presets; shared validation rejects windows outside the selected battle date and hours. Unavailable members do not enter a time window. No copied Kingdom 710 battle date or minister slot inventory. Appointment requests are preferences, not reservations. Speedups use days, including general speedups allocated to that activity; each general speedup must be counted only once. The minister layout follows the supplied K710 screenshots: Day 1 construction, Day 2 research, Day 4 training, and Day 5 overflow. Time buttons are availability preferences, not a live booking inventory. Upgrade materials were removed at the user’s request.

All three forms now use authenticated member APIs. Account registration is open, sign-in uses member ID and a separate website password, and email supports confirmation and recovery. Profiles and dated KvK forms persist through the Supabase schema in `supabase/migrations/001_kingdom_hub.sql`. Unconfigured installations allow local validation without claiming to save. Live Supabase credentials, email delivery, and end-to-end production testing remain outstanding.

Run `npm ci`, then `npm run dev`. `npm run typecheck` verifies TypeScript. Supabase/Vercel configuration and live verification remain outstanding.

Kingdom Timeline now links to https://kingshotoptimizer.com/kingdom-timeline/2312/ in a new tab. This third-party community page tracks observed and predicted progression milestones. No external predicted dates are copied into the local kingdom history. Total power and troop counts were removed from the player profile; troop tiers and TG selections remain. Pet and event-shop planners were removed, including their former routes and calculation components.

Backend implementation follows the official Supabase SSR, Auth user-data, and row-level-security documentation: https://supabase.com/docs/guides/auth/server-side/nextjs, https://supabase.com/docs/guides/auth/managing-user-data, and https://supabase.com/docs/guides/database/postgres/row-level-security. The actual SQL migration passes isolated ownership/role/storage-policy tests in PGlite; this is not a live Supabase test.
