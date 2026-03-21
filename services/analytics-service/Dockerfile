FROM node:20-alpine

# Build with repo root as context: docker build -f services/analytics-service/Dockerfile .
WORKDIR /repo

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY services/analytics-service/package.json ./services/analytics-service/package.json

RUN npm ci --omit=dev --workspace=shared --workspace=services/analytics-service

COPY shared ./shared
COPY services/analytics-service ./services/analytics-service

WORKDIR /repo/services/analytics-service
EXPOSE 3006
CMD ["node", "src/app.js"]
