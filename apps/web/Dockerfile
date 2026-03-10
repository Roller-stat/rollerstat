# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
ARG NEXT_PUBLIC_BASE_URL=https://rollerstat.com
ARG NEXT_PUBLIC_SITE_URL=https://rollerstat.com
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
COPY . .
# apps/web/.env.local is a symlink to ../../.env.local in local dev.
# In Docker context, root .env.local is excluded, so create a safe placeholder.
RUN touch .env.local
RUN npm run build:web

FROM base AS runner
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/packages/content ./packages/content
RUN touch .env.local

ENV NODE_ENV=production

EXPOSE 3000
CMD ["npm", "run", "start:web"]
