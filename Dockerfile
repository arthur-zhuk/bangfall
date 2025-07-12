FROM node:18-alpine

WORKDIR /app

# Copy server's package.json instead of root package.json
COPY server/package*.json ./
RUN npm ci --only=production

# Create server directory and copy server files
RUN mkdir -p server
COPY server/index.js ./server/index.js

EXPOSE 3001

CMD ["node", "server/index.js"] 