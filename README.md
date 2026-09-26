<h1 align="center">RespondeAê</h1>

<p align="center">Rede social de perguntas e respostas em que cada pergunta é paga via PIX.</p>

<p align="center">
	<a href="https://github.com/AlexGalhardo/respondeae/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/AlexGalhardo/respondeae/actions/workflows/ci.yml/badge.svg?branch=main"></a>
	<a href="https://github.com/AlexGalhardo/respondeae/actions/workflows/e2e.yml"><img alt="E2E" src="https://github.com/AlexGalhardo/respondeae/actions/workflows/e2e.yml/badge.svg?branch=main"></a>
	<a href="LICENSE"><img alt="Licença MIT" src="https://img.shields.io/badge/licen%C3%A7a-MIT-blue.svg"></a>
	<a href="CHANGELOG.md"><img alt="Versão" src="https://img.shields.io/badge/vers%C3%A3o-0.8.4-green.svg"></a>
</p>

## Sobre

No RespondeAê cada pessoa tem um perfil público onde recebe perguntas, como no Retrospectiva ou no NGL, com uma diferença: quem pergunta paga um valor via PIX. Quem responde recebe parte desse valor e pode sacar para a própria chave PIX; se não responder no prazo, a pergunta expira.

- Perguntas públicas ou anônimas, com respostas públicas ou privadas
- Pagamento via PIX pela [AbacatePay](https://abacatepay.com), confirmado por webhook
- Feed da comunidade e de quem você segue, ranking das respostas mais curtidas
- Perfis públicos ou privados, com seguidores, bloqueios e várias opções de privacidade
- Login com email e senha ou Google

## Stack

| Camada | Tecnologia |
|---|---|
| App | [Next.js](https://nextjs.org) 16 (App Router) + [React](https://react.dev) 19 + TypeScript 6 |
| Dados | [PostgreSQL](https://www.postgresql.org) + [Prisma](https://www.prisma.io) 7 (SQLite opcional no dev local) |
| Auth | [NextAuth](https://next-auth.js.org) 4 (credenciais + Google) e [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) |
| Pagamentos | [AbacatePay](https://abacatepay.com) (PIX) |
| Email e uploads | [Resend](https://resend.com) + React Email, [UploadThing](https://uploadthing.com) |
| UI | Tailwind CSS 4, shadcn/ui, TanStack Query 5 |
| Qualidade | Bun 1.4 (package manager e test runner), Biome, Playwright, Husky + commitlint |
| Deploy | [Vercel](https://vercel.com) via GitHub Actions |

## Rodando localmente

Pré-requisito: [Bun](https://bun.sh) 1.4.2. Escolha o script do seu sistema e banco; cada um instala dependências, cria o `.env`, prepara o banco e roda o seed:

| | SQLite (sem instalar nada) | Postgres já instalado | Postgres via Docker |
|---|---|---|---|
| **Windows** (Git Bash) | [`setup-windows-using-sqlite.sh`](setups/setup-windows-using-sqlite.sh) | [`setup-windows-using-postgres.sh`](setups/setup-windows-using-postgres.sh) | [`setup-windows-using-postgres-with-docker.sh`](setups/setup-windows-using-postgres-with-docker.sh) |
| **Linux/macOS** | [`setup-unix-using-sqlite.sh`](setups/setup-unix-using-sqlite.sh) | [`setup-unix-using-postgres.sh`](setups/setup-unix-using-postgres.sh) | [`setup-unix-using-postgres-with-docker.sh`](setups/setup-unix-using-postgres-with-docker.sh) |

```bash
git clone git@github.com:AlexGalhardo/respondeae.git
cd respondeae
bash setups/setup-unix-using-postgres-with-docker.sh   # ou o script da tabela acima
bun run dev
```

Variáveis de ambiente estão documentadas em [`.env.example`](.env.example).

## Comandos

```bash
bun run dev               # servidor de desenvolvimento
bun run build             # build de produção (precisa de um Postgres acessível)
bun run lint              # Biome (lint + format)
bun run test              # testes unitários
bun run test:integration  # integração contra um Postgres descartável
bun run test:e2e          # Playwright
bun run prisma:studio     # GUI do banco
```

## Documentação

A pasta [`docs/`](docs) explica o projeto por área (também é o contexto que os agentes de IA usam, via [`AGENTS.md`](AGENTS.md)):

- [Arquitetura e regras de segurança](docs/architecture.md)
- [Banco de dados](docs/database.md)
- [Autenticação](docs/auth.md)
- [Pagamentos PIX](docs/payments-pix.md)
- [Emails](docs/email.md)
- [Uploads](docs/uploads.md)
- [Bot do Telegram](docs/telegram-bot.md)
- [Testes](docs/testing.md)
- [Deploy e CI/CD](docs/deployment.md)
- [Segurança (auditoria OWASP Top 10:2025)](docs/security.md)

## Contribuindo

Commits seguem [Conventional Commits](https://www.conventionalcommits.org/pt-br) (validado pelo commitlint) e o versionamento segue [SemVer](https://semver.org/lang/pt-BR/). Antes de abrir um PR, `bun run lint:ci`, `bunx tsc --noEmit`, `bun run build` e os testes precisam passar: o CI bloqueia em todos. Mudanças relevantes entram no [`CHANGELOG.md`](CHANGELOG.md).

## Créditos e licença

Criado por [Alex Galhardo](https://github.com/AlexGalhardo). Distribuído sob a [licença MIT](LICENSE).
