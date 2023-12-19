FROM node:16

WORKDIR /app

COPY package*.json ./

COPY . .

EXPOSE 80

CMD ["npm", "start"]
