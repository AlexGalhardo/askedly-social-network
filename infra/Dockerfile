# Build/execução em container opcional (o deploy oficial é Vercel, ver docs/deployment.md).
# Uso a partir da raiz do repo: docker build -f infra/Dockerfile -t askedly-social-network .
FROM oven/bun:1.4.2-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* entra no bundle do browser, então precisa existir no build.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_TEST_MODE=false
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_TEST_MODE=$NEXT_PUBLIC_TEST_MODE
RUN bun run prisma:generate
# O build só exige que a variável exista (nenhuma página consulta o banco no build); o valor real vem em runtime.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build bun run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["bun", "run", "start"]
