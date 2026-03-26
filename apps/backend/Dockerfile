FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# install netcat
RUN apk add --no-cache netcat-openbsd

EXPOSE 8000

CMD ["sh", "-c", "until nc -z mysql 3306; do echo 'waiting for db...'; sleep 2; done; npx prisma migrate deploy && node src/index.js"]