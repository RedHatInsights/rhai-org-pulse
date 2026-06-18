# Org Pulse Core — Frontend (complete)
#
# Builds and serves the core platform with team-tracker module only.
# Use this if you don't need to add extra modules. If you do, use
# core.frontend-builder.Dockerfile + core.frontend-runtime.Dockerfile instead.

# Stage 1: Build the Vue SPA
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal:9.8-1781566494@sha256:1d4e4dafffb3b6c969bf585d21ca5316dd2906bedbbfeab6f90ce95c8f54e266 AS core-build

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

RUN npm run build

# Stage 3: Serve with Red Hat Hardened nginx (distroless)
FROM registry.access.redhat.com/hi/nginx:1.30.2@sha256:8224a88f9347d50a50eb99a9b0009f986b31cc203fa313288ce9f1ee59a9144d

COPY deploy/nginx-default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
