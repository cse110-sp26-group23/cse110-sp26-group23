# Stage 1: generate the JSDoc API reference from the source modules.
FROM node:22-alpine AS docs
WORKDIR /build
COPY package.json package-lock.json jsdoc.config.json ./
COPY source/js ./source/js
RUN npm ci --no-audit --no-fund && npm run docs

# Stage 2: serve the static app, with the generated API reference under /api.
FROM nginx:alpine
COPY /source /usr/share/nginx/html
COPY --from=docs /build/docs/api /usr/share/nginx/html/api
COPY /source/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
