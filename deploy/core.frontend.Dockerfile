# Org Pulse Core — Frontend (complete)
#
# Builds and serves the core platform with team-tracker module only.
# Use this if you don't need to add extra modules. If you do, use
# core.frontend-builder.Dockerfile + core.frontend-runtime.Dockerfile instead.

# Stage 1: Build the Vue SPA
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal:9.8-1788225630@sha256:f85d0fed6eba84a6574b03921748e012342f3a22a73a68fe427dafd5f8b305e8 AS core-build

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
COPY modules/jira-solve-agent/ ./modules/jira-solve-agent/

RUN npm run build

# Stage 3: Serve with Red Hat Hardened nginx (distroless)
FROM registry.access.redhat.com/hi/nginx:1.30.4@sha256:e54f1103a60f9b60e2f17778abaf23e6ff73b76f1ea8374728c5443f1e82dcf0

COPY deploy/nginx-default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
