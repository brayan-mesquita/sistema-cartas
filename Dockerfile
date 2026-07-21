# ==========================================
# STAGE 1: Base image & Dependencies
# ==========================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install --legacy-peer-deps

# ==========================================
# STAGE 2: Builder
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV DATABASE_URL "file:./data/legendarios.db"

# A URL publica precisa existir em tempo de BUILD: o metadata da home e estatico,
# entao og:image e resolvido aqui, nao em runtime. Sem isso o preview do WhatsApp
# aponta para localhost. Cadastrar como Build Argument no Easypanel.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Gerar Prisma Client e Build do Next.js
RUN npx prisma generate
RUN npm run build

# ==========================================
# STAGE 3: Production Runner (Standalone)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV DATABASE_URL "file:./data/legendarios.db"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Criar pasta para o SQLite com permissões corretas
RUN mkdir -p /app/prisma/data && chown -R nextjs:nodejs /app/prisma/data

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Inicializa o banco de dados e tabelas SQLite sem depender do CLI do npx/prisma
CMD ["sh", "-c", "node prisma/init-db.js && node server.js"]
