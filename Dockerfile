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

# Start the application with seed then production start
CMD sh -c "pnpm prisma:migrate && pnpm seed && pnpm start:prod"
