# Ferramentas

O que cada ferramenta faz no projeto, onde está configurada e como rodar. Versões exatas ficam no `package.json` (sempre fixas, sem `^`).

| Ferramenta | Papel | Configuração | Comando |
| --- | --- | --- | --- |
| Bun | Gerenciador de pacotes, runner de scripts e de testes | `packageManager` no `package.json`, `bun.lock` | `bun install`, `bun run <script>`, `bun test` |
| Node | Runtime do Next em produção, no smoke e no e2e (a Vercel roda Node) | `engines.node` | `next start` |
| TypeScript | Tipagem estrita; também valida as chaves de tradução | `tsconfig.json`, `global.d.ts` | `bunx tsc --noEmit` |
| Biome | Lint e formatação de TS, JSON e CSS | `biome.json`, lendo `.editorconfig` | `bun run lint`, `bun run lint:ci`, `bun run format` |
| markdownlint | Lint de Markdown (`*.md` da raiz, `docs/`, `.github/`) | `.markdownlint-cli2.jsonc` | `bun run lint:md`, `bun run lint:md:fix` |
| Prisma | ORM, migrations e seed | `prisma.config.ts`, `prisma/schema.prisma`, `prisma/schema.sqlite.prisma` | `bun run prisma:generate`, `prisma:migrate`, `prisma:db:seed`, `prisma:studio` |
| next-intl | Traduções (en, pt, es) | `i18n/`, `messages/`, plugin em `next.config.mjs` | ver [`i18n.md`](i18n.md) |
| Playwright | Testes e2e no Chromium | `playwright.config.ts` | `bun run test:e2e` |
| Husky | Hooks do git | `.husky/` | instalado pelo `prepare` |
| lint-staged | Biome e markdownlint só nos arquivos do commit | `lint-staged` no `package.json` | roda no `pre-commit` |
| commitlint | Exige Conventional Commits | `commitlint.config.js` | roda no `commit-msg` |
| Docker | Postgres local e a aplicação completa em modo demonstração | `infra/` | ver [`docker.md`](docker.md) |
| GitHub Actions | CI (lint, tipos, auditoria, testes, build) e e2e | `.github/workflows/` | ver [`deployment.md`](deployment.md) |
| Dependabot | Atualizações semanais de dependências e actions | `.github/dependabot.yml` | automático |
| Vercel CLI | Deploy, variáveis de ambiente, logs | `vercel.json`, `infra/vercel-build.sh` | ver [`vercel-deploy.md`](vercel-deploy.md) |
| Stripe CLI | Encaminhar webhooks para `localhost` e disparar eventos de teste | não versionada | ver [`stripe-setup.md`](stripe-setup.md) |
| graphify | Grafo do código para agentes de IA explorarem sem grep cego | `graphify-out/` | skill `graphify` |

## Hooks do git

| Hook | O que roda |
| --- | --- |
| `pre-commit` | `bun run format` e `lint-staged` |
| `commit-msg` | commitlint |
| `pre-push` | `bun run test` e `bun run build` |

Não pule hook com `--no-verify`: corrija o que ele apontou.

## Validar como o CI

```bash
bun run lint:ci
bun run lint:md
bunx tsc --noEmit
bun run test
bun run test:integration   # Postgres descartável, ver testing.md
bun run build
```

O passo a passo completo, com smoke e e2e, está na skill `askedly-local-verification` (`.claude/skills/`).

## Formatação

`.editorconfig` é a fonte da verdade: tab, largura 4, LF. O Biome lê esse arquivo. Exceções: YAML e `package.json` usam espaços.

## Dependências

- Última versão **estável**, com versão exata. Nada de `latest`, `next`, `rc`, `beta`.
- Dependência nova precisa de justificativa: primeiro a biblioteca padrão, a plataforma e o que já está instalado.
- Imagens Docker com tag de versão fixa (`postgres:17-alpine`, `oven/bun:1.4.2-alpine`).
