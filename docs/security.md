# Segurança — auditoria OWASP Top 10:2025

Auditoria da aplicação inteira contra a edição vigente, **OWASP Top 10:2025** (lida em <https://top10.owasp.org/2025>, não de memória). Fase 14 do `PLAN.md`. Regras que valem para todo código novo estão em [`architecture.md`](architecture.md#regras-de-segurança-obrigatórias).

## Superfícies de ataque

Mapeadas com `graphify` (grafo em `graphify-out/`) e conferidas uma a uma:

| Superfície | Quantidade | Como autentica |
|---|---|---|
| API routes (`app/api/**/route.ts`) | 35 | `getSessionUser()`/`getServerSession`; públicas por desenho: `health`, `send-contact-email`, `reset-password/*` (token), `cronjob` (`CRON_SECRET`), `webhook/abacatepay` (secret + HMAC), NextAuth, UploadThing (sessão no middleware) |
| Server Actions (`actions/*.ts`) | 20 exports | toda action é endpoint público; identidade sempre da sessão |
| Webhook PIX | 1 | secret na URL + HMAC-SHA256 do corpo cru com comparação em tempo constante; idempotente |
| Cron | 1 | `Authorization: Bearer $CRON_SECRET` |
| Uploads | 1 | sessão no middleware do UploadThing, imagem até 4 MB, 1 arquivo |
| `NEXT_PUBLIC_*` | 3 | `APP_URL`, `CLOUDFLARE_TURNSTILE_SITE_KEY`, `TEST_MODE`: nenhuma é segredo |

## Resultado por categoria

| Categoria | Situação | Achados corrigidos nesta fase (commit) |
|---|---|---|
| **A01 Broken Access Control** | ✅ | Repositórios com `"use server"` expostos como endpoints (dump de usuários, troca de senha de qualquer conta, webhook forjado) — `56297c2`; `followUserAction` aceitava o id de quem segue — `cbea9bc`; report de pergunta sem checar o dono — `0ea71b6`; perfil, feed e ranking entregando conteúdo de perfis restritos, respostas privadas e perguntas pendentes — `7c12399`, `49fa2bf` |
| **A02 Security Misconfiguration** | ✅ | Sem headers de segurança — `331b67e`; `simulate-payment` dependia só de `NEXT_PUBLIC_TEST_MODE` — `aea020d` |
| **A03 Software Supply Chain Failures** | ✅ | `bun audit --audit-level=high` sem achados (1 ignorado com justificativa: `deepmerge-ts`, só no CLI do Prisma); gate bloqueante no CI; dependências pinadas em versão exata |
| **A04 Cryptographic Failures** | ✅ | Token de reset guardado em texto puro — agora só o SHA-256 (`ee06fbc`); senhas com bcrypt custo 12; segredos fora do bundle |
| **A05 Injection** | ✅ | Nenhum achado: único SQL cru é template parametrizado (`rate-limit.service.ts`); sem `dangerouslySetInnerHTML`; entradas validadas com Zod |
| **A06 Insecure Design** | ✅ | Reset de senha enviava o link para um email fixo do dono, sem validar a nova senha e com token reutilizável em corrida — `ee06fbc`; dados privados inteiros serializados para o browser — `56af2f5` |
| **A07 Authentication Failures** | ✅ | Sem rate limit — `5e7c045`; o próprio limite permitia travar o login da vítima — `cb828ec`; enumeração de contas pelo tempo de resposta — `7b7b6d2`; troca de senha sem senha atual — `174c2dc`; captcha do login falhava aberto — `5e7c045` |
| **A08 Software or Data Integrity Failures** | ✅ | Nenhum achado novo: webhook com HMAC e idempotência; valor da pergunta vem do pagamento confirmado (Fase 11) |
| **A09 Security Logging and Alerting Failures** | ✅ | Ninguém era avisado de força bruta — alerta no Telegram na primeira violação de cada janela, email mascarado (`6cf13a5`); formulário de contato deixou de logar o corpo |
| **A10 Mishandling of Exceptional Conditions** | ✅ | `error.message` interno (Prisma, rede) devolvido ao client em ~15 lugares — `9821d16`; captcha falhando aberto em erro de rede — `5e7c045` |

Cada correção tem teste que prova o comportamento (`tests/integration/*`, `lib/**/*.test.ts`, `tests/e2e/profile.spec.ts`). As correções da Fase 11 (saque, preço da pergunta, rotas de pergunta/seguir, segredos da AbacatePay, cron) estão no `CHANGELOG.md`.

## Riscos aceitos e próximos passos

| Severidade | Item | Por que ficou assim |
|---|---|---|
| Médio | Sessões JWT continuam válidas por até 30 dias depois de uma troca/reset de senha | Revogar JWT exige uma "versão de sessão" no banco checada a cada request. Vale fazer junto com a próxima mudança de auth |
| Médio | CSP sem `script-src` (só `frame-ancestors`) | Um CSP completo precisa de nonce e de liberar Turnstile, UploadThing e os scripts inline do Next; sem testar em produção quebraria o site |
| Médio | Cadastro sem captcha verificado no servidor | O token do Turnstile é de uso único e é gasto no `signIn` logo depois. Mitigado pelo rate limit de 5 cadastros/hora por IP |
| Baixo | Login por email trava por 15 min após 10 falhas (mesmo com a senha certa) | Troca clássica contra força bruta. Com a ordem atual, travar a conta de alguém exige resolver 10 captchas por janela |
| Baixo | A mensagem "usuário sem senha" revela que o email é de uma conta Google | Decisão de UX: orienta o usuário a entrar pelo Google |
| Baixo | `pix/check` responde o status de qualquer `pix_id` para qualquer usuário logado | Só devolve status/expiração e o id é aleatório (não enumerável) |
| Baixo | Secret da URL do webhook comparado com `!==` | A assinatura HMAC, verificada em tempo constante logo depois, é o controle que vale |
| Info | A tela de perfil só mostra perguntas para o dono e seguidores (a flag `privacy_show_questions_answered_only_to_followers` nunca mudava nada) | Comportamento existente, mantido. Decisão de produto registrada no `PLAN.md` |

## Como manter

- Rodar `bun audit` (o CI já bloqueia) e os testes de integração, que cobrem os controles de acesso de dinheiro, reset e perfil.
- Toda action/rota nova segue as regras de [`architecture.md`](architecture.md#regras-de-segurança-obrigatórias): identidade da sessão, sem linha inteira de `User` para o browser, rate limit em endpoint abusável, captcha falhando fechado.
- `lib/repositories/public-surface.test.ts` falha se `"use server"` voltar para `lib/`.
