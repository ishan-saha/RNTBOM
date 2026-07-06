# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Build the React frontend
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
 
WORKDIR /app/frontend
 
# Install dependencies (cached layer)
COPY frontend/package*.json ./
RUN npm install
 
# Copy frontend source
COPY frontend/ ./
 
# VITE_* vars are baked into the bundle at build time.
# Default to /api so requests go to the same origin served by the backend.
# Override at build time: docker build --build-arg VITE_API_URL=https://example.com/api
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
 
RUN npm run build
 
# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Production image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-bookworm
 
WORKDIR /app/backend
 
# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
 
# Install Syft
RUN curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | \
    sh -s -- -b /usr/local/bin
 
# Install Grype
RUN curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | \
    sh -s -- -b /usr/local/bin
 
# Verify installation
RUN git --version
RUN syft version
RUN grype version
 
COPY backend/package*.json ./
RUN npm install --omit=dev
 
COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist
 
ENV NODE_ENV=production
ENV PORT=8000
 
EXPOSE 8000
 
CMD ["node", "server.js"]