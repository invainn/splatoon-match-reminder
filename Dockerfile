FROM node:8.11.4-alpine

RUN mkdir /usr/app
WORKDIR /usr/app

COPY . .
RUN yarn install

ENV NODE_ENV production

CMD [ "yarn", "start" ]