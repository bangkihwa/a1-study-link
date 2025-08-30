# ===== Client build stage =====
FROM node:18-alpine AS client-build
WORKDIR /app
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client ./client
RUN cd client && npm run build

# ===== Server build stage =====
FROM node:18-alpine AS server-build
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci
COPY server ./server
RUN cd server && npm run build

# ===== Runtime stage (nginx for static, node for api via separate service) =====
# Note: Client will actually be served by nginx in a dedicated image via docker-compose.
# This stage is kept for optional single-image builds.
FROM nginx:1.27-alpine AS client-runtime
WORKDIR /usr/share/nginx/html
COPY --from=client-build /app/client/dist .
COPY dockerfile/nginx.conf /etc/nginx/conf.d/default.conf

# Optional healthcheck file
RUN printf 'OK' > /usr/share/nginx/html/health.txt

# ===== Server runtime image =====
FROM node:18-alpine AS server-runtime
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY --from=server-build /app/server/dist ./server/dist
COPY server/data ./data
EXPOSE 5000
CMD ["node", "server/dist/index.js"]


