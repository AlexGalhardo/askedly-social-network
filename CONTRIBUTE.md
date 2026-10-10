# Contributing

Thanks for your interest in Askedly Social Network. This guide covers what you need to open a pull request that can be merged.

## Getting started

1. Fork and clone the repository.
2. Install [Bun](https://bun.sh) 1.4.2.
3. Run one of the scripts in [`setups/`](setups) (SQLite, Postgres or Postgres with Docker). It installs dependencies, creates `.env`, prepares the database and seeds it.
4. Start the app with `bun run dev`.

To run the whole product without any external account (payments are simulated), use the demo stack in [`docs/docker.md`](docs/docker.md).

## Before you write code

- For anything larger than a small fix, open an issue first and describe the change. It avoids work that cannot be merged.
- Read [`docs/architecture.md`](docs/architecture.md) and [`docs/security.md`](docs/security.md). Every Server Action and API route is a public endpoint: the acting user always comes from the session, never from the request body, and money values are always computed on the server.
- User-facing text is never hardcoded. Add it to `messages/en`, `messages/pt` and `messages/es` (see [`docs/i18n.md`](docs/i18n.md)).

## Pull request checklist

CI blocks on every item below, so run them locally first:

```bash
bun run lint:ci            # Biome, warnings fail
bun run lint:md            # markdownlint
bunx tsc --noEmit
bun run test               # unit tests
bun run test:integration   # needs a disposable Postgres, see docs/testing.md
bun run build
```

- Add or update tests for the behaviour you changed. Security controls need a test that proves them (for example "another user cannot do this").
- Schema changes need a new Prisma migration and the same change in `prisma/schema.sqlite.prisma`. Never edit a migration that is already committed.
- Record notable changes in [`CHANGELOG.md`](CHANGELOG.md) and update `docs/` when the change affects how the project is understood or operated.
- New dependencies need a justification in the pull request. Versions are pinned exactly, stable releases only.

## Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org) and are validated by commitlint (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`). Keep each commit to one logical change. Versioning follows [SemVer](https://semver.org).

## Reporting security issues

Do not open a public issue. Follow [`SECURITY.md`](SECURITY.md).

## License

By contributing you agree that your contribution is licensed under the [MIT License](LICENSE.md).
