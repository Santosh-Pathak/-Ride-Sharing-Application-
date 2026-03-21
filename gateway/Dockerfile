FROM node:20-alpine

# Build with repo root as context: docker build -f gateway/Dockerfile .
WORKDIR /repo

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY gateway/package.json ./gateway/package.json

RUN npm ci --omit=dev --workspace=shared --workspace=gateway

COPY shared ./shared
COPY gateway ./gateway

WORKDIR /repo/gateway
EXPOSE 3000
CMD ["node", "src/app.js"]
