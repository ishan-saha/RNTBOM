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
# Stage 2: Production image — backend only, with frontend dist copied in
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app/backend

# Install backend production dependencies (no devDependencies)
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy backend source
COPY backend/ ./

# Copy built frontend from Stage 1
# backend/app.js references path.join(__dirname, '../frontend/dist')
# __dirname = /app/backend  →  ../frontend/dist = /app/frontend/dist  ✓
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# ─── Runtime environment ──────────────────────────────────────────────────────
# Set production mode so backend serves the static frontend
ENV NODE_ENV=production

# Default port — override at runtime: docker run -e PORT=8000 ...
ENV PORT=8000

EXPOSE 8000

# Start backend (it serves both API and the built frontend)
CMD ["node", "server.js"]
