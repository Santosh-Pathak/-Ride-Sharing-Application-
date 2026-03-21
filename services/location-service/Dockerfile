FROM node:20-alpine

# Build with repo root as context: docker build -f services/location-service/Dockerfile .
WORKDIR /repo

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY services/location-service/package.json ./services/location-service/package.json

RUN npm ci --omit=dev --workspace=shared --workspace=services/location-service

COPY shared ./shared
COPY services/location-service ./services/location-service

WORKDIR /repo/services/location-service
EXPOSE 3003
CMD ["node", "src/app.js"]
