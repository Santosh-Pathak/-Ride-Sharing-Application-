FROM node:20-alpine

# Build with repo root as context: docker build -f services/ride-service/Dockerfile .
WORKDIR /repo

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY services/ride-service/package.json ./services/ride-service/package.json

RUN npm ci --omit=dev --workspace=shared --workspace=services/ride-service

COPY shared ./shared
COPY services/ride-service ./services/ride-service

WORKDIR /repo/services/ride-service
EXPOSE 3002
CMD ["node", "src/app.js"]
