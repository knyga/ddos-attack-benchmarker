FROM node:14.19

COPY ./ /app
WORKDIR /app

RUN npm ci

ENTRYPOINT ["node", "app.js"]
