# Org Pulse Core — Frontend (complete)
#
# Builds and serves the core platform with team-tracker module only.
# Use this if you don't need to add extra modules. If you do, use
# core.frontend-builder.Dockerfile + core.frontend-runtime.Dockerfile instead.

# Stage 1: Build the Vue SPA
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal:9.8-1790168814@sha256:9823eba78a979ab9b4346a91678d74518bdeb1fc762752689bf1354cbc492b54 AS core-build

USER 0

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.mjs tailwind.config.mjs postcss.config.mjs ./
COPY src/ ./src/
COPY public/ ./public/
COPY shared/client/ ./shared/client/

# Core module only
COPY modules/team-tracker/ ./modules/team-tracker/

# Stage 2: Add customization to the core base image
FROM core-build AS build

# Add additional modules
COPY modules/ai-impact/ ./modules/ai-impact/
COPY modules/cve-triage/ ./modules/cve-triage/
COPY modules/jira-solve-agent/ ./modules/jira-solve-agent/
COPY modules/backport-tracker/ ./modules/backport-tracker/

RUN npm run build

# Stage 3: Serve with Red Hat Hardened nginx (distroless)
FROM registry.access.redhat.com/hi/nginx:1.30.5@sha256:d35cbf4710c857ab7488914c8ab98c0d02ea954f225f928bfb1f708542605200

COPY deploy/nginx-default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
