# ─── Backend Production Dockerfile ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL required by Prisma CLI
RUN apk add --no-cache openssl libc6-compat

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy source code and build
COPY tsconfig.json ./
COPY src ./src/
RUN npx prisma generate
RUN npm run build

# ─── Production Runner Stage ────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl libc6-compat

# Copy production dependencies and generated Prisma client
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

# Copy compiled JavaScript output
COPY --from=builder /app/dist ./dist

# Create non-root user for security
USER node

EXPOSE 5000

CMD ["node", "dist/index.js"]
