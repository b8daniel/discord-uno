FROM node:16
RUN mkdir -p /usr/src/uno/bot
WORKDIR /usr/src/uno/bot

RUN npm install -g pnpm

COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install -P

COPY . .
CMD ["node", "."]