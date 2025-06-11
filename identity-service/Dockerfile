
# Use the official Node.js image as the base image

FROM node:23.4.0-alpine
# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
# Install dependencies
RUN npm ci --only=production
# Copy the rest of the application code to the working directory
COPY . .
# Expose the port the app runs on
EXPOSE 3001
# Start the application
CMD ["node", "src/server.js"]