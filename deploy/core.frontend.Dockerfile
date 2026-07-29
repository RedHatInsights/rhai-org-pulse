# Org Pulse Core — Frontend (complete)
#
# Builds and serves the core platform with team-tracker module only.
# Use this if you don't need to add extra modules. If you do, use
# core.frontend-builder.Dockerfile + core.frontend-runtime.Dockerfile instead.

# Stage 1: Build the Vue SPA
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal:9.8-1785287245@sha256:22478b029a3723d240fb7a7751e0d5e9655c54352e9f9f55206d060786839143 AS core-build

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
FROM registry.access.redhat.com/hi/nginx:1.30.4@sha256:03fdc8a86b85b99fd0424c5969a947586a33d644590fdcdb8b31d3edeaa5b84d

COPY deploy/nginx-default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
