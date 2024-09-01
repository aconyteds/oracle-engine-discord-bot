# Stage 1: Build Stage
FROM node:22 AS build

# Set working directory
WORKDIR /src

# Copy only package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install development dependencies (including Prisma)
RUN npm install

# Copy the rest of the application files
COPY . .

# Copy Prisma schema files
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Build the application (if applicable, for TypeScript or Webpack builds)
RUN npm run build

# Stage 2: Production Stage
FROM node:22-alpine AS production

# Set working directory
WORKDIR /src

# Copy application files from the build stage
COPY --from=build /src/dist ./dist
COPY --from=build /src/prisma ./prisma

# Copy package.json and package-lock.json to install production dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD ["node", "dist/index.js"]
