FROM node:20-alpine

# Build with repo root as context: docker build -f services/user-service/Dockerfile .
WORKDIR /repo

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY services/user-service/package.json ./services/user-service/package.json

RUN npm ci --omit=dev --workspace=shared --workspace=services/user-service

COPY shared ./shared
COPY services/user-service ./services/user-service

WORKDIR /repo/services/user-service
EXPOSE 3001
CMD ["node", "src/app.js"]
