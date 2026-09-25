# ---- deps ----
FROM node:20-bookworm-slim AS deps
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma/schema.prisma ./prisma/schema.prisma
# Dummy URL in case any postinstall step loads prisma.config.ts (no connection made).
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
RUN npm ci

# ---- builder ----
FROM node:20-bookworm-slim AS builder
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Dummy URL so prisma.config.ts loads: `generate` never connects to the DB.
# (All data pages are force-dynamic, so `next build` doesn't query either.)
ARG DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate
# DB not needed at build time: all data pages are force-dynamic.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build:web

# ---- runner ----
FROM node:20-bookworm-slim AS runner
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
EXPOSE 3000
ENV HOSTNAME="0.0.0.0" PORT="3000"
ENTRYPOINT ["./docker-entrypoint.sh"]
