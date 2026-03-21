FROM node:20-alpine

# Build with repo root as context: docker build -f services/notification-service/Dockerfile .
WORKDIR /repo

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY services/notification-service/package.json ./services/notification-service/package.json

RUN npm ci --omit=dev --workspace=shared --workspace=services/notification-service

COPY shared ./shared
COPY services/notification-service ./services/notification-service

WORKDIR /repo/services/notification-service
EXPOSE 3005
CMD ["node", "src/app.js"]
