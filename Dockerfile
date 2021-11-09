FROM node:16
RUN mkdir -p /usr/src/uno/bot
WORKDIR /usr/src/uno/bot

COPY package*.json ./
RUN npm ci --only=production

COPY . .
CMD ["node", "."]