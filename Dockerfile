FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787

COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/dist-server ./dist-server
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/scripts/generate-config.mjs ./scripts/generate-config.mjs
COPY --from=build --chown=node:node /app/scripts/container-entrypoint.mjs ./scripts/container-entrypoint.mjs

USER node
EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD ["node", "-e", "require('node:http').get('http://127.0.0.1:' + (process.env.PORT || 8787), response => process.exit(response.statusCode >= 200 && response.statusCode < 400 ? 0 : 1)).on('error', () => process.exit(1))"]

ENTRYPOINT ["node", "scripts/container-entrypoint.mjs"]
