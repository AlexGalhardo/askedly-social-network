# Deploy na Vercel

Como o deploy funciona (build, cron, CI) está em [`deployment.md`](deployment.md). Este arquivo é o roteiro para colocar no ar, à mão ou por um agente de IA.

Projeto atual: `respondeae`, time `galhardos-projects`, produção em `https://respondeae.vercel.app`. O nome do projeto na Vercel não foi trocado junto com o do repositório: trocar muda o domínio `*.vercel.app`, e com ele `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` e as URLs dos webhooks.

## Versão manual, passo a passo

1. **CLI.** `bun add --global vercel` e `vercel login`.
2. **Vincular** a pasta ao projeto (cria `.vercel/`, que fica fora do git):

   ```bash
   vercel link --project respondeae --scope galhardos-projects
   ```

   Projeto novo: `vercel link` sem `--project` cria um, e a integração Git é ligada em Settings > Git.
3. **Banco.** Um Postgres acessível pela internet em `DATABASE_URL` (o do Marketplace da Vercel serve: Storage > Create Database).
4. **Variáveis de ambiente.** `.env.example` é a lista. Para cada uma:

   ```bash
   vercel env add NOME production   # pede o valor sem mostrá-lo; repita com `preview` quando fizer sentido
   vercel env ls
   ```

   Obrigatórias em produção: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`, `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`, `CLOUDFLARE_TURNSTILE_SECRET`. Por recurso: `ABACATEPAY_*` (PIX), `STRIPE_*` (créditos, ver [`stripe-setup.md`](stripe-setup.md)), `RESEND_*` (emails), `UPLOADTHING_TOKEN` (avatar), `GOOGLE_*` (login Google), `TELEGRAM_*` (logs). Nunca defina `PAYMENTS_SIMULATED`, `NEXT_PUBLIC_TEST_MODE=true` nem `NODE_ENV`.
5. **Deploy.** O caminho normal é `git push origin main`: a integração Git faz o deploy de produção, e cada PR ganha um preview. Pela CLI, sem passar pelo git:

   ```bash
   vercel deploy           # preview
   vercel deploy --prod    # produção
   ```

   O build roda `infra/vercel-build.sh`: `prisma generate`, `prisma migrate deploy` (só em produção) e `next build`.
6. **Conferir.**

   ```bash
   curl -s https://respondeae.vercel.app/api/health                                   # 200
   curl -s -o /dev/null -w "%{http_code}\n" https://respondeae.vercel.app/api/cronjob # 401 sem o segredo
   curl -s -o /dev/null -w "%{http_code}\n" -X POST https://respondeae.vercel.app/api/webhook/stripe   # 400 sem assinatura
   vercel logs https://respondeae.vercel.app
   ```

7. **Voltar atrás.** `vercel rollback` devolve a produção ao deploy anterior. Migration já aplicada não é desfeita: migrations devem ser aditivas.

## Versão com agentes de IA (CLI e MCP)

**Pré-requisitos que só você pode dar:** `vercel login` feito (o agente confere com `vercel whoami`), ou o MCP da Vercel conectado; e os valores dos segredos, digitados por você ou já gravados no projeto. O agente não deve ler `.env` nem pedir segredo no chat.

**Pedido para o agente:**

```text
Faça o deploy de produção deste projeto na Vercel seguindo docs/vercel-deploy.md:
1. `vercel whoami` e `vercel link --project respondeae --scope galhardos-projects --yes`.
2. Compare `vercel env ls production` com .env.example e liste o que falta. Não imprima valores.
3. Valide como o CI antes: `bun run lint:ci`, `bun run lint:md`, `bunx tsc --noEmit`, `bun run test`, `bun run build`.
4. `git push origin main` e acompanhe o deploy até READY (`vercel ls`, `vercel inspect <url>`).
5. Rode as checagens do passo 6 do roteiro manual e mostre os códigos HTTP.
6. Se o deploy falhar, leia o log de build (`vercel inspect <url> --logs`), corrija a causa e repita.
   Não use `vercel rollback` sem me perguntar.
```

**O que cada ferramenta cobre:**

| Tarefa | CLI | MCP (servidor `vercel`) |
| --- | --- | --- |
| Vincular e fazer deploy | `vercel link`, `vercel deploy --prod` | `create_deployment` |
| Estado e logs | `vercel ls`, `vercel inspect --logs`, `vercel logs` | `list_deployments`, `get_deployment`, `get_runtime_logs`, `get_runtime_errors` |
| Variáveis de ambiente | `vercel env add`, `vercel env ls`, `vercel env rm` | `create_project_env`, `filter_project_envs`, `edit_project_env` |
| Promover e reverter | `vercel promote`, `vercel rollback` | `request_promote`, `request_rollback` |
| Domínios | `vercel domains`, `vercel alias` | `add_project_domain`, `verify_project_domain` |

**Regras para o agente:** deploy de produção, troca de variável de produção, rollback e compra de domínio pedem sua confirmação; segredo nunca aparece em log, commit ou resposta; se o CI estiver vermelho, o agente corrige a causa em vez de pular hook ou teste.

## Depois do primeiro deploy

- Cadastre os webhooks com a URL de produção: AbacatePay (`/api/webhook/abacatepay?webhookSecret=...`) e Stripe (`bun infra/stripe-setup.ts`).
- Ative Deployment Checks (Settings > Deployment Checks) exigindo os checks `CI` e `E2E`, para a produção só subir com o CI verde.
- Domínio próprio: Settings > Domains, e então atualize `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` e as URLs dos webhooks.
