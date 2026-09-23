# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versioning follows [SemVer](https://semver.org/). Every commit on `main` is a release.

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
