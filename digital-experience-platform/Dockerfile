FROM node:24-alpine AS build
WORKDIR /src

RUN corepack enable
COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./

# Use BuildKit caches (fast in CI and local)
RUN --mount=type=cache,target=/root/.local/share/pnpm \
    --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/usr/local/share/.cache/yarn \
    sh -lc '\
      if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
      elif [ -f package-lock.json ]; then npm ci; \
      elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
      else npm install; fi'

COPY . .
ENV NODE_ENV=production
RUN sh -lc '\
      if [ -f pnpm-lock.yaml ]; then pnpm run build; \
      elif [ -f package-lock.json ]; then npm run build; \
      elif [ -f yarn.lock ]; then yarn build; \
      else npm run build; fi'

COPY --from=build /src/dist/ /app/dist