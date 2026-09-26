# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versioning follows [SemVer](https://semver.org/). Every commit on `main` is a release.

## [0.8.0] - 2026-09-25

### Security

- Rate limit login, signup, contact and password flows

## [0.7.0] - 2026-09-25

### Added

- Let askers report the answer they received

### Security

- Only the owner can report a received question

## [0.6.4] - 2026-09-25

### Changed

- Stop writing to the database on every session read
- Bring testing and deployment docs in line with the real setup

### Fixed

- Run on SQLite by skipping skipDuplicates there
- Keep a single main landmark per page

## [0.6.3] - 2026-09-25

### Changed

- Run Next on Node in tests and e2e against a production build
- Remove the unused like/dislike chain from sent questions
- Fix every Biome warning
- Fail the lint gate on Biome warnings

## [0.6.2] - 2026-09-25

### Changed

- Move the anonymous-asker helper out of the repository

### Fixed

- Render the theme toggle without depending on the theme
- Render the captcha on the first load of the signup page

## [0.6.1] - 2026-09-25

### Security

- Require the current password to change it
- Keep the Resend key out of the source and the client bundle
- Stop exposing repositories as public server actions
- Strip private user data from profiles and the session

## [0.6.0] - 2026-09-25

### Added

- Migrate AbacatePay integration to API v2

## [0.5.5] - 2026-09-25

### Changed

- Clear every Biome lint error and make lint blocking in CI
- Remove redundant comments and commented-out code
- Stop sending the acting nickname from question hooks

### Security

- Patch transitive vulnerabilities and make the audit gate blocking

## [0.5.4] - 2026-09-25

### Changed

- Remove 30 unused shadcn components and 28 unused dependencies

### Fixed

- Clear all type errors and stop ignoring them at build time
- Restore the updatedUser binding updatePersonalInfo still reads
- Show toasts from profile, question, payment and ranking screens

## [0.5.3] - 2026-09-25

### Security

- Price questions by the confirmed payment and the session asker
- Require CRON_SECRET on the cron route
- Only let the receiver accept or reject a follow request
- Hash every password with bcrypt cost 12

## [0.5.2] - 2026-09-25

### Fixed

- Make the Turnstile captcha work for password login in production

### Security

- Derive withdraw owner, amount and PIX key on the server
- Take the acting user from the session in question and follow routes
- Keep AbacatePay secrets out of the browser bundle

## [0.5.1] - 2026-09-25

### Fixed

- Render page content once in the root layout
- Read zod v4 issues so form validation errors reach the user
- Stop disconnecting the shared prisma client after each request

## [0.5.0] - 2026-09-25

### Changed

- Upgrade prisma to 7.10.0 with driver adapters
- Upgrade @react-email/components to 1.0.12
- Drop framer-motion in favor of the existing CSS spin

## [0.4.0] - 2026-09-25

### Changed

- Rename TODO.md to PLAN.md
- Vendor third-party agent skills into .claude/
- Add .editorconfig and make biome follow it
- Add github actions for lint, test, build and deploy
- Require skills in agent guides, add OWASP Top Ten final phase

## [0.3.1] - 2026-09-23

### Changed

- Update husky hooks for staged linting and pre-push tests

## [0.3.0] - 2026-09-23

### Changed

- Add unit tests for lib/ pure functions with bun:test
- Apply biome organizeImports across app/
- Add integration tests for users repository
- Add smoke test for the production server
- Add Playwright e2e suite and document two critical bugs found

## [0.2.1] - 2026-09-23

### Changed

- Adopt semver and conventional commits

### Fixed

- Add .dockerignore to keep secrets out of the build context

## [0.2.0] - 2026-09-23

### Added

- Add setup scripts for windows/unix with sqlite/postgres/docker

### Changed

- Centralize infra configs under infra/

## [0.1.3] - 2026-09-23

### Changed

- Add AGENTS.md and CLAUDE.md
- Add AI-agent-focused documentation

## [0.1.2] - 2026-09-23

### Changed

- Pin all dependencies to exact latest stable versions

## [0.1.1] - 2026-09-23

### Changed

- Remove outdated documentation
- Add claude skills and refactor master plan
- Adopt bun 1.4.2 and fix biome config for biome 2.5.1

## [0.1.0] - 2026-06-25

### Added

- Initial version of the application: public profiles, paid questions through PIX, feed and ranking
