FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# ❗ IMPORTANT (dev deps bhi install)
RUN npm install

COPY . .

# ❗ Prisma generate (must)
RUN npx prisma generate

EXPOSE 8000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]