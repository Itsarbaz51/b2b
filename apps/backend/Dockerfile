FROM node:20-alpine

WORKDIR /app

# 1. Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# 2. Copy app
COPY . .

# 3. Prisma generate (IMPORTANT)
RUN npx prisma generate

# 4. Expose port
EXPOSE 8000

# 5. Run migrations + start app
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]