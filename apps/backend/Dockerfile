FROM node:20-alpine

WORKDIR /app

# install deps
COPY package*.json ./
RUN npm install --production

# copy code
COPY . .

EXPOSE 8000

CMD ["node", "src/index.js"]    