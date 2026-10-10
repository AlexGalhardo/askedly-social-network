<h1 align="center">Askedly Social Network</h1>

<p align="center">Rede social global de perguntas e respostas em que cada pergunta é paga, por PIX ou com créditos via Stripe.</p>

<p align="center">
 <a href="https://github.com/AlexGalhardo/askedly-social-network/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/AlexGalhardo/askedly-social-network/actions/workflows/ci.yml/badge.svg?branch=main"></a>
 <a href="https://github.com/AlexGalhardo/askedly-social-network/actions/workflows/e2e.yml"><img alt="E2E" src="https://github.com/AlexGalhardo/askedly-social-network/actions/workflows/e2e.yml/badge.svg?branch=main"></a>
 <a href="LICENSE.md"><img alt="Licença MIT" src="https://img.shields.io/badge/licen%C3%A7a-MIT-blue.svg"></a>
 <a href="CHANGELOG.md"><img alt="Versão" src="https://img.shields.io/badge/vers%C3%A3o-0.14.0-green.svg"></a>
</p>

## Sobre

No Askedly Social Network cada pessoa tem um perfil público onde recebe perguntas, como no Retrospectiva ou no NGL, com uma diferença: quem pergunta paga um valor via PIX. Quem responde recebe parte desse valor e pode sacar para a própria chave PIX; se não responder no prazo, a pergunta expira.

- Perguntas públicas ou anônimas, com respostas públicas ou privadas
- Pagamento via PIX pela [AbacatePay](https://abacatepay.com), confirmado por webhook
- Pagamento com créditos em dólar comprados por cartão na [Stripe](https://stripe.com), com repasse automático a quem responde por Stripe Connect
- Interface em inglês (padrão), português e espanhol
- Feed da comunidade e de quem você segue, ranking das respostas mais curtidas
- Perfis públicos ou privados, com seguidores, bloqueios e várias opções de privacidade
- Login com email e senha ou Google

## Stack

| Camada | Tecnologia |
| --- | --- |
| App | [Next.js](https://nextjs.org) 16 (App Router) + [React](https://react.dev) 19 + TypeScript 7 |
| Dados | [PostgreSQL](https://www.postgresql.org) + [Prisma](https://www.prisma.io) 7 (SQLite opcional no dev local) |
| Auth | [NextAuth](https://next-auth.js.org) 4 (credenciais + Google) e [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) |
| Pagamentos | [AbacatePay](https://abacatepay.com) (PIX) e [Stripe](https://stripe.com) (créditos + Connect) |
| Email e uploads | [Resend](https://resend.com) + React Email, [UploadThing](https://uploadthing.com) |
| UI | Tailwind CSS 4, shadcn/ui, TanStack Query 5 |
| Qualidade | Bun 1.4 (package manager e test runner), Biome, markdownlint, Playwright, Husky + commitlint |
| Deploy | [Vercel](https://vercel.com) via GitHub Actions |

## Rodando localmente

Pré-requisito: [Bun](https://bun.sh) 1.4.2. Escolha o script do seu sistema e banco; cada um instala dependências, cria o `.env`, prepara o banco e roda o seed:

| | SQLite (sem instalar nada) | Postgres já instalado | Postgres via Docker |
| --- | --- | --- | --- |
| **Windows** (Git Bash) | [`setup-windows-using-sqlite.sh`](setups/setup-windows-using-sqlite.sh) | [`setup-windows-using-postgres.sh`](setups/setup-windows-using-postgres.sh) | [`setup-windows-using-postgres-with-docker.sh`](setups/setup-windows-using-postgres-with-docker.sh) |
| **Linux/macOS** | [`setup-unix-using-sqlite.sh`](setups/setup-unix-using-sqlite.sh) | [`setup-unix-using-postgres.sh`](setups/setup-unix-using-postgres.sh) | [`setup-unix-using-postgres-with-docker.sh`](setups/setup-unix-using-postgres-with-docker.sh) |

```bash
git clone git@github.com:AlexGalhardo/askedly-social-network.git
cd askedly-social-network
bash setups/setup-unix-using-postgres-with-docker.sh   # ou o script da tabela acima
bun run dev
```

Variáveis de ambiente estão documentadas em [`.env.example`](.env.example).

### Tudo em Docker, sem conta externa

Sobe Postgres, migrations, seed e o app, com pagamentos simulados (PIX confirmado sozinho, créditos e repasses Stripe fictícios):

```bash
docker compose -f infra/docker-compose.demo.yaml up --build
```

Abra <http://localhost:3000> e entre com `admin@gmail.com` / `adminBR@123` (painel em `/admin`). Detalhes em [`docs/docker.md`](docs/docker.md).

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
- [Pagamentos Stripe (créditos e Connect)](docs/payments-stripe.md) e [como configurar a Stripe](docs/stripe-setup.md)
- [Internacionalização](docs/i18n.md)
- [Emails](docs/email.md)
- [Uploads](docs/uploads.md)
- [Bot do Telegram](docs/telegram-bot.md)
- [Testes](docs/testing.md)
- [Deploy e CI/CD](docs/deployment.md) e [roteiro de deploy na Vercel](docs/vercel-deploy.md)
- [Docker (modo demonstração)](docs/docker.md)
- [Ferramentas](docs/tooling.md)
- [Segurança (auditoria OWASP Top 10:2025)](docs/security.md)

## Contribuindo

Leia [`CONTRIBUTING.md`](CONTRIBUTING.md). Falhas de segurança: [`SECURITY.md`](SECURITY.md), nunca em issue pública.

Commits seguem [Conventional Commits](https://www.conventionalcommits.org/pt-br) (validado pelo commitlint) e o versionamento segue [SemVer](https://semver.org/lang/pt-BR/). Antes de abrir um PR, `bun run lint:ci`, `bunx tsc --noEmit`, `bun run build` e os testes precisam passar: o CI bloqueia em todos. Mudanças relevantes entram no [`CHANGELOG.md`](CHANGELOG.md).

## Créditos e licença

Criado por [Alex Galhardo](https://github.com/AlexGalhardo). Distribuído sob a [licença MIT](LICENSE.md).
