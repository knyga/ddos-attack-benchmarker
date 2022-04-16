FROM node:14.19

COPY ./ /app
WORKDIR /app

RUN npm ci
RUN which node

ENTRYPOINT ["node", "app.js"]
