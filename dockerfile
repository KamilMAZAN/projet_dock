FROM node:16

WORKDIR /app

COPY package*.json ./

COPY . .

RUN npm install redis

EXPOSE 80

CMD ["npm", "start"]
