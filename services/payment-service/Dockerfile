FROM node:20-alpine

# Build with repo root as context: docker build -f services/payment-service/Dockerfile .
WORKDIR /repo

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY services/payment-service/package.json ./services/payment-service/package.json

RUN npm ci --omit=dev --workspace=shared --workspace=services/payment-service

COPY shared ./shared
COPY services/payment-service ./services/payment-service

WORKDIR /repo/services/payment-service
EXPOSE 3004
CMD ["node", "src/app.js"]
