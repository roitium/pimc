# Build from the monorepo root:
# docker build -f apps/lab-blog/Dockerfile -t pimc-lab-blog .
FROM oven/bun:1.4.0 AS bun
FROM node:24-bookworm-slim AS build
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
COPY apps/lab-blog/package.json apps/lab-blog/package.json
COPY apps/naive-blog/package.json apps/naive-blog/package.json
RUN bun install --frozen-lockfile
COPY apps/lab-blog apps/lab-blog
RUN bun run build:lab-blog

FROM nginx:mainline-alpine-slim AS runtime
COPY --from=build /app/apps/lab-blog/dist /usr/share/nginx/html
EXPOSE 80
