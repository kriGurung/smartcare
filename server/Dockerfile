# SmartCare API — production image (build context: repository root)
FROM node:20-bookworm-slim

# bcrypt is a native module; install build tools, then keep the image slim.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

COPY server/src ./src

ENV NODE_ENV=production \
    PORT=5000

EXPOSE 5000

CMD ["node", "src/server.js"]
