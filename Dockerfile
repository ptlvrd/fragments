# Dockerfile for Fragments Microservice

# 1. Base image
FROM node:22.12.0-alpine

# 2. Metadata
LABEL maintainer="Vrunda Patel <vvpatel20@myseneca.ca>"
LABEL description="Fragments node.js microservice"

# 3. Environment variables
ENV PORT=8080
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

# 4. Set working directory
WORKDIR /app

# 5. Copy package files
COPY package*.json ./

# 6. Install dependencies
RUN npm install

# 7. Copy app source
COPY ./src ./src

# 8. Copy auth file (Basic Auth only)
COPY ./tests/.htpasswd ./tests/.htpasswd

# 9. Run server
CMD ["npm", "start"]

# 10. Document exposed port
EXPOSE 8080
