# Optional container build/run (the official deploy is Vercel, see docs/deployment.md).
# Usage from the repo root: docker build -f infra/Dockerfile -t askedly-social-network .
FROM oven/bun:1.4.2-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* goes into the browser bundle, so it must exist at build time.
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_TEST_MODE=false
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_TEST_MODE=$NEXT_PUBLIC_TEST_MODE
RUN bun run prisma:generate
# The build only requires the variable to exist (no page queries the database at build time); the real value comes at runtime.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build SKIP_ENV_VALIDATION=true bun run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["bun", "run", "start"]
