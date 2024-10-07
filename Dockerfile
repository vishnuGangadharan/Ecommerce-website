FROM node:alpine
WORKDIR /usr/src/app
COPY  package*.json .
RUN npm ci
COPY . .
COPY public/admin ./public/admin
CMD ["npm","start"]

