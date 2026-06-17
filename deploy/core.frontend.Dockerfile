# Org Pulse Core — Frontend (complete)
#
# Builds and serves the core platform with team-tracker module only.
# Use this if you don't need to add extra modules. If you do, use
# core.frontend-builder.Dockerfile + core.frontend-runtime.Dockerfile instead.

# Stage 1: Build the Vue SPA
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal@sha256:75a2c4753c2475d715e31304ec1effef61770713e6e9fdafdcb80351dbdf3ba5 AS build

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

RUN npm run build

# Stage 2: Serve with Red Hat Hardened nginx (distroless)
FROM registry.access.redhat.com/hi/nginx@sha256:e176a40c88b70de84fa89c2915ab321b5761c29b188636f4111a4e3fa72714a4

COPY deploy/nginx-default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
