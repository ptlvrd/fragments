# ========================
# Build Stage
# ========================
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for testing/build)
RUN npm install

# Copy entire source code
COPY . .

# ========================
# Production Stage
# ========================
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy only the needed files from builder
COPY --from=builder /app .

# Install only production dependencies
RUN npm install --only=production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=80

# Expose port
EXPOSE 80

# Run the app
CMD ["npm", "start"]
