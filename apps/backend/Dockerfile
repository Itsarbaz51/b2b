# 1. Base image
FROM node:20-alpine

# 2. App directory
WORKDIR /app

# 3. Install dependencies (better caching)
COPY package*.json ./
RUN npm ci --only=production

# 4. Copy app files
COPY . .

# 5. Prisma client generate
RUN npx prisma generate

# 6. Expose port
EXPOSE 8000

# 7. Start with safe DB migration (production way)
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]