# Stage 1: Build Stage
FROM node:22 AS build

# Set working directory
WORKDIR /src

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the application (if applicable, for TypeScript or Webpack builds)
RUN npm run build

# Stage 2: Production Stage
FROM node:22-alpine AS production

# Set working directory
WORKDIR /src

# Copy only the necessary files from the build stage
COPY --from=build /src/node_modules ./node_modules
COPY --from=build /src/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD ["node", "dist/index.js"]
