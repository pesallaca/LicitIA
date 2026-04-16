# Stage 1: Build client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build server
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npx tsc

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app

# Install production server dependencies only
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy built assets
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=client-build /app/client/dist ./client/dist

# Copy schema.sql (needed at runtime for migrations)
COPY server/src/db/schema.sql ./server/src/db/schema.sql

# Create data directory
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/licitia.db

EXPOSE 3000
CMD ["node", "server/dist/index.js"]
