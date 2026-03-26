FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# 🔥 IMPORTANT: copy prisma first
COPY prisma ./prisma

# generate client
RUN npx prisma generate

# copy rest app
COPY . .

EXPOSE 8000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]