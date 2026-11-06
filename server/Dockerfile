FROM node:20-bookworm-slim
WORKDIR /app
COPY package.json ./
RUN apt-get update && apt-get install -y --no-install-recommends docker.io && rm -rf /var/lib/apt/lists/* && npm install --omit=dev
COPY server.js ./
ENV NODE_ENV=production PORT=8787
EXPOSE 8787
CMD ["npm", "start"]
