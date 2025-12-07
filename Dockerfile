# Development Stage
FROM node:24-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose the application port
EXPOSE 3333

# Expose Prisma Studio port
EXPOSE 5555

# Command to run the application in development mode
CMD ["npm", "run", "start:dev"]