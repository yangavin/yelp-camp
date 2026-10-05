FROM node

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm ci --omit=dev

# Bundle app source
COPY . .

EXPOSE 8080

CMD [ "node", "app.js" ]
