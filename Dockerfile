# Use a smaller base image for production
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /app

# Copy over node_modules and dist from the build
COPY node_modules ./node_modules
COPY dist ./dist
COPY package.json .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD ["node", "dist/index.js"]
