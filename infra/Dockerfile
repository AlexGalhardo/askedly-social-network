# Build/execução em container opcional (o deploy oficial é Vercel, ver docs/deployment.md).
# Uso a partir da raiz do repo: docker build -f infra/Dockerfile -t respondeae .
FROM oven/bun:1.4.2-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run prisma:generate
RUN bun run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["bun", "run", "start"]
