FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
COPY bin/ ./bin/
COPY src/ ./src/
COPY public/ ./public/

LABEL org.opencontainers.image.source = "https://github.com/petewall/slides"
EXPOSE 4000
ENTRYPOINT ["node", "bin/presenter.js"]
CMD ["--content", "/content/content.yaml"]
