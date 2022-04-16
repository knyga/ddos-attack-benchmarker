FROM node:14.19-alpine

COPY ./ /app
WORKDIR /app

RUN npm i

ENTRYPOINT ["node app.js"]
