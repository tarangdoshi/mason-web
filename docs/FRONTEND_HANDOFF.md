# Mason frontend integration — founder handoff

Status: feature branch / Preview review. Production is unchanged. Backend-dependent acceptance is explicitly outstanding under the founder's instruction not to repair staging or modify Production data.

## What changed

Prerna's forest-green, sand and photographic public design is integrated into canonical Mason Next.js. New home, about, packages, why and contact views retain responsive layout, motion, fonts, logos and images. Existing CRM, admin, checkout, package detail, evidence, communications, policies, and CMS tools remain accessible.

The inline booking card and booking dialog use the real assessment form/transport: name, validated Indian mobile and email, optional location, assessment type, notes, privacy notice, error feedback and duplicate-submit protection. The dialog retains form state on close/reopen. Contact sends real guidance enquiries with the same name/email/mobile/location fields as the assessment form (no package selector, no assessment type/notes) — see "Contact form location parity" in `PROJECT_STATE.md` and ADR-012 in `DECISIONS.md`. No form logs customer data or claims success without an API success response.

## Repositories and files

- Read-only visual source: `https://github.com/prernaa-99/Mason-company-`, commit `670a599399d022aaedda779b20fa63cf7e556497`; reference `https://mason-company.vercel.app`.
- Changed repository: `https://github.com/tarangdoshi/mason-web`, branch `feature/prerna-frontend-integration`, base `b84f056`.
- Worktree: `/Users/tarang/Documents/Documents/Aegis/integrations/mason-web`.
- Main changes: `app/(public)`, `components`, `public/prerna`, public icons; existing assessment/location/analytics helpers; `lib/api.ts`, `lib/lead-context.ts`, SEO routes, CSS/PostCSS, package/lock/TypeScript/lint configuration and these docs.
- Companion `mason-api`: inspected and tested; no source changes. Original dirty `apps/web` checkout preserved. Workspace knowledge graph updated separately.

## Dependencies and environment

Retained Next 15.5.12, React/React DOM 19.1.1 and Node 20 requirement. Added GSAP, @gsap/react, Lenis, Tailwind 4/@tailwindcss/postcss and postcss-prefix-selector. Added ESLint 9, matching eslint-config-next 15.5.12 and @eslint/eslintrc; added a standalone pnpm lockfile. Existing ranged dependencies were resolved by the first standalone lockfile; review that lockfile as part of release. Install reports a transitive Sanity peer warning. No API dependency changes.

Keep existing Production variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, server-only `SANITY_API_READ_TOKEN`, `SANITY_PREVIEW_SECRET`. Public variables require rebuilding when changed. No new Production environment variables.

Preview intentionally has no API target while no approved safe backend is available. Requests report HTTP 503 and retain form input; no mock API and no Production test leads. Temporary legacy-preview API URL/protection credentials were removed from the feature branch configuration. Existing browser Places/analytics/CMS Preview configuration is retained. Google autocomplete needs a usable key with the Preview hostname allowed; failure/manual entry never gates the form.

## Backend behaviour retained

- All assessment submissions continue through `/api/leads/guidance` → `/api/v1/public/leads/guidance`; the API creates ENQUIRY regardless of location.
- Goa/Bangalore/OTHER/UNKNOWN remain silent server-authoritative classifications. Client metadata is carried intact. Empty location submits `Address not provided` with empty/manual location metadata and UNKNOWN classification; no database schema change.
- Name, phone, email, notes, assessment type, contact metadata, canonical quiz, campaign/UTM/click identifiers and CTA/session context remain in the request.
- Existing secondary package checkout and BOOKING_REQUEST behaviour remain unchanged.
- Production API/database/Redis were not modified; no new infrastructure was created.

## Functional differences and review items

- New primary navigation adds Packages and Contact; legacy routes still work. Booking now opens a dialog, with a second inline form. Assessment type/notes/privacy disclosures extend the source form to preserve Mason functionality.
- The source's alternative package-advisor scoring is replaced by Mason's existing risk quiz and metadata contract. Package-interest CTAs retain attribution.
- Copy promising online payment was corrected to assessment/team follow-up and existing payment methods; no payment gateway was introduced.
- Existing policy content retained; `/refund` redirects to `/terms` rather than publishing placeholder legal details.
- New homepage/about presentation copy and images are code-managed. Existing Sanity Studio and prior homepage draft renderer remain at `/content-preview`; draft links continue to work. Mapping every new design section to Sanity is still a founder/editorial review item. The old CMS homepage is not the new public presentation.
- Legacy package detail, checkout, evidence, communications, policies, CRM and admin retain their existing visual presentation.

## Verification

See the verification record below. Automated classifier/contract tests are not a substitute for creating and checking a lead in a real backend.

Backend-dependent checks remaining: real lead creation and CRM/database read-back; authoritative classification for selected Goa/Bangalore/non-service addresses; attribution/UTM/quiz read-back; actual Google Places success on the deployed hostname; API-backed checkout and authenticated CRM operation. No claim is made that these passed in Preview.

## Exact Production cutover (future, after review)

1. Complete the remaining backend-dependent checks using an explicitly approved environment. Confirm CMS/editorial and retained-page visual differences are accepted. Do not use this Preview's unavailable backend response as acceptance of lead creation.
2. Review the PR and the final commit's Vercel Preview at desktop and 390px. Require install, lint, typecheck, tests and production build to pass for that commit.
3. In Vercel `tarangdoshi5-2978s-projects/aegis-living-web`, confirm Production variables listed above still match the current working configuration, the Git repository is `tarangdoshi/mason-web`, and Production branch is `main`. Do not carry Preview-only API configuration to Production.
4. Record the then-current Production deployment URL/ID and commit for rollback. At this audit the live target is `dpl_HiHLHcSHp9RK4ssye7bCmNdJSsLY`, `https://aegis-living-t0iceirhz-tarangdoshi5-2978s-projects.vercel.app`.
5. After founder approval, merge the reviewed PR into `main` through GitHub. Let the existing Git-backed Vercel pipeline build/release it with Production variables. Do not promote the Preview artifact or run a local `--prod` deployment.
6. Confirm Vercel Ready and the custom domain points at the merged commit. Recheck navigation, assets, SEO, CRM login and an explicitly authorized lead smoke test. Confirm no change to the API deployment or database schema.

## Exact rollback

1. If release verification fails, open the web project in Vercel → Deployments → select the recorded previous Production deployment → Instant Rollback. CLI equivalent for the currently recorded target: `vercel rollback https://aegis-living-t0iceirhz-tarangdoshi5-2978s-projects.vercel.app --scope tarangdoshi5-2978s-projects`. Use the newly recorded target if Production changed before cutover.
2. Verify `https://www.masoncompany.in` serves the previous design and its existing API integrations. Do not roll back, clear or migrate API/database/Redis/CMS data; frontend rollback does not undo or delete leads.
3. Create a revert branch from current `main`, revert the frontend merge (a normal `git revert <squash-commit>` for squash merge; `git revert -m 1 <merge-commit>` for a merge commit), then open a revert PR. Validate its Preview and merge it through the same workflow so Git history matches the rolled-back release and a later auto-deploy cannot reintroduce the change.
4. Preserve the failed feature branch and reports for diagnosis. No local branch is deployed directly to Production.
