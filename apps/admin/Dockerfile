# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
COPY . .
# apps/admin/.env.local is a symlink to ../../.env.local in local dev.
# In Docker context, root .env.local is excluded, so create a safe placeholder.
RUN touch .env.local
RUN npm run build:admin

FROM base AS runner
ENV NODE_ENV=production
ENV ADMIN_PORT=3001

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/apps/admin ./apps/admin
COPY --from=builder /app/packages/content ./packages/content
RUN touch .env.local

EXPOSE 3001
CMD ["npm", "run", "start:admin"]
