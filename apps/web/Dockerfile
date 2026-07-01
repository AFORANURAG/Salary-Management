FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS prepare
COPY . .
RUN pnpm dlx turbo@^2.3.3 prune web --docker

FROM base AS builder
COPY --from=prepare /app/out/json/ ./
COPY --from=prepare /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=prepare /app/.npmrc ./.npmrc
RUN pnpm install --frozen-lockfile
COPY --from=prepare /app/out/full/ ./
ENV NEXT_PUBLIC_API_URL=http://localhost:3001
RUN pnpm --filter @salary-mgmt/types build
RUN pnpm --filter web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
