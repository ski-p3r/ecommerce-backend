FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN pnpm build

# Expose the port
EXPOSE 3000

# Create a startup script
RUN echo '#!/bin/sh\npnpm prisma:migrate && pnpm seed && pnpm start:prod' > /app/startup.sh && chmod +x /app/startup.sh

# Start the application with the startup script
CMD ["/app/startup.sh"]
