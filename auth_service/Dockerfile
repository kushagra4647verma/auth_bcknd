FROM node:18-alpine

WORKDIR /app

# Copy only dependency files first (better caching)
COPY package*.json ./

RUN npm install --production

# Copy source
COPY . .

EXPOSE 5000

CMD ["node", "index.js"]
