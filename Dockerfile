FROM node:18-alpine

WORKDIR /app

# Copy server's package.json instead of root package.json
COPY server/package*.json ./
RUN npm ci --only=production

# Copy server files
COPY server/index.js ./index.js

EXPOSE 3001

CMD ["node", "index.js"] 