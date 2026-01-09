FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 8000

# Run with ts-node-dev for hot reloading
CMD ["npm", "run", "dev"]
