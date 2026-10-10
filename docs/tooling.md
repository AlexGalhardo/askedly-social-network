# Tooling

What each tool does in the project, where it is configured and how to run it. Exact versions live in `package.json` (always pinned, no `^`).

| Tool | Role | Configuration | Command |
| --- | --- | --- | --- |
| Bun | Package manager, script runner and test runner | `packageManager` in `package.json`, `bun.lock` | `bun install`, `bun run <script>`, `bun test` |
| Node | Next's runtime in production, in smoke and in e2e (Vercel runs Node) | `engines.node` | `next start` |
| TypeScript | Strict typing; also validates the translation keys | `tsconfig.json`, `global.d.ts` | `bunx tsc --noEmit` |
| Biome | Lint and formatting of TS, JSON and CSS | `biome.json`, reading `.editorconfig` | `bun run lint`, `bun run lint:ci`, `bun run format` |
| markdownlint | Markdown lint (`*.md` at the root, `docs/`, `.github/`) | `.markdownlint-cli2.jsonc` | `bun run lint:md`, `bun run lint:md:fix` |
| Prisma | ORM, migrations and seed | `prisma.config.ts`, `prisma/schema.prisma`, `prisma/schema.sqlite.prisma` | `bun run prisma:generate`, `prisma:migrate`, `prisma:db:seed`, `prisma:studio` |
| Zod | Input validation and environment variable validation at build time | `lib/schemas/`, `lib/env.ts` (called from `next.config.ts`) | runs on `next build`/`next start` |
| next-intl | Translations (en, pt, es) | `i18n/`, `messages/`, plugin in `next.config.ts` | see [`i18n.md`](i18n.md) |
| Tailwind CSS 4 | Styling, CSS-first | `@theme inline` block in `app/globals.css`, `postcss.config.mjs`; no `tailwind.config.ts` | part of the build |
| Base UI | Accessible UI primitives (`@base-ui/react`) | wrappers in `components/ui/`; no `components.json` | see [UI](#ui) |
| Playwright | E2E tests on Chromium | `playwright.config.ts` | `bun run test:e2e` |
| Husky | Git hooks | `.husky/` | installed by `prepare` |
| lint-staged | Biome and markdownlint only on the files in the commit | `lint-staged` in `package.json` | runs on `pre-commit` |
| commitlint | Requires Conventional Commits | `commitlint.config.js` | runs on `commit-msg` |
| Docker | Local Postgres and the full application in demo mode | `infra/` | see [`docker.md`](docker.md) |
| GitHub Actions | CI (lint, types, audit, tests, build) and e2e | `.github/workflows/` | see [`deployment.md`](deployment.md) |
| Dependabot | Weekly updates of dependencies and actions | `.github/dependabot.yml` | automatic |
| Vercel CLI | Deployment, environment variables, logs, Marketplace resources (Neon, Stripe) | `vercel.json`, `infra/vercel-build.sh` | see [`vercel-deploy.md`](vercel-deploy.md) |
| Stripe CLI | Forward webhooks to `localhost` and fire test events | not versioned; installed with `npm i -g @stripe/cli` | see [`stripe-setup.md`](stripe-setup.md) |
| graphify | Code graph for AI agents to explore without blind grep | `graphify-out/` | `graphify` skill |

## UI

- **Base UI** (`@base-ui/react`), not shadcn/Radix. The wrappers live in `components/ui/`.
- Composition uses the `render` prop instead of `asChild`: `<Button render={<Link href="/" />}>`.
- State selectors are `data-[checked]`/`data-[active]`/`data-[open]` (Base UI data attributes), not `data-[state=...]`.
- **Tailwind 4 is CSS-first**: design tokens live in the `@theme inline` block of `app/globals.css`, and plugins come in through `@plugin` (typography). There is no `tailwind.config.ts` and no `components.json`; a class such as `bg-primary` only exists because its token is declared in that block.
- The brand in the UI is "Askedly": logo in `components/askedly-logo.tsx`, favicon in `app/icon.svg`.

## Environment variables

`lib/env.ts` validates the environment with Zod every time `next.config.ts` loads. Essential variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`) fail the build; optional features only warn with `[env] ...` and stay off. `SKIP_ENV_VALIDATION=true` skips the check and exists only for the Docker image build (`infra/Dockerfile`). Tested in `lib/env.test.ts`.

## Git hooks

| Hook | What runs |
| --- | --- |
| `pre-commit` | `bun run format` and `lint-staged` |
| `commit-msg` | commitlint |
| `pre-push` | `bun run test` and `bun run build` |

Do not skip a hook with `--no-verify`: fix what it pointed out.

## Validating like CI

```bash
bun run lint:ci
bun run lint:md
bunx tsc --noEmit
bun run test
bun run test:integration   # disposable Postgres, see testing.md
bun run build
```

The complete step by step, with smoke and e2e, is in the `askedly-local-verification` skill (`.claude/skills/`).

## Formatting

`.editorconfig` is the source of truth: tab, width 4, LF. Biome reads that file. Exceptions: YAML and `package.json` use spaces.

## Language

Code, comments, documentation and commit messages are in English. The interface is translated (en default, pt, es) through next-intl; user content is never translated.

## Dependencies

- Latest **stable** version, at an exact version. No `latest`, `next`, `rc`, `beta`.
- A new dependency needs a justification: first the standard library, the platform and what is already installed.
- Docker images with a pinned version tag (`postgres:17-alpine`, `oven/bun:1.4.2-alpine`).
