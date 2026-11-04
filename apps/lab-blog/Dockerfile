# syntax=docker/dockerfile:1
# Build from the monorepo root:
# docker build -f apps/lab-blog/Dockerfile -t pimc-lab-blog .
FROM oven/bun:1.4.4 AS bun
FROM node:26.13.0-bookworm-slim AS build
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
COPY apps/lab-blog/package.json apps/lab-blog/package.json
COPY apps/naive-blog/package.json apps/naive-blog/package.json
COPY packages/content/package.json packages/content/package.json
COPY packages/astro-check/package.json packages/astro-check/package.json
RUN bun install --frozen-lockfile
COPY packages/content packages/content
COPY scripts scripts
COPY apps/lab-blog apps/lab-blog
ARG VAULT_GIT_URL
ARG VAULT_GIT_REF
RUN --mount=type=secret,id=vault_git_token,env=VAULT_GIT_TOKEN bun run build:lab-blog

FROM nginx:mainline-alpine-slim AS runtime
COPY --from=build /app/apps/lab-blog/dist /usr/share/nginx/html
EXPOSE 80
