
FROM node:20.11-alpine AS react-build

RUN mkdir /app
WORKDIR /app

COPY ["package.json", "tsconfig.json", "index.html", "postcss.config.js", "tailwind.config.ts", "components.json", ".npmrc", "netlify.toml", "vite.config.ts", "/app/"]

COPY ./public /app/public/
COPY ./client /app/client
WORKDIR /app
RUN npm install --legacy-peer-deps

RUN npm -s run build

FROM nginx:stable-alpine AS production

COPY --from=react-build /app/dist/spa /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

RUN addgroup --system nginxuser && \
    adduser --system --ingroup nginxuser nginxuser && \
    mkdir -p /usr/share/nginx/html && \
    chown -R nginxuser:nginxuser /usr/share/nginx/html && \
    mkdir -p /var/cache/nginx && \
    chown -R nginxuser:nginxuser /var/cache/nginx && \
    mkdir -p /var/log/nginx && \
    chown -R nginxuser:nginxuser /var/log/nginx && \
    chown -R nginxuser:nginxuser /etc/nginx/nginx.conf && \
    touch /run/nginx.pid && \
    chown -R nginxuser:nginxuser /run/nginx.pid && \
    chown -R nginxuser:nginxuser /etc/nginx/conf.d && \
    chown -R nginxuser:nginxuser /etc/nginx/conf.d/default.conf

USER nginxuser

EXPOSE 3000
CMD [ "nginx", "-g", "daemon off;" ]


## Build stage
#FROM node:18-alpine AS builder
#WORKDIR /app
#
## Copy package files and install dependencies
#COPY package*.json ./
##RUN npm ci && npm cache clean --force
#RUN npm install --ignore-scripts --force
#
## Copy source and build
#COPY . .
#RUN npm run build
#
## Production stage
#FROM node:18-alpine
#WORKDIR /app
#
## Install production dependencies only
#COPY package*.json ./
##RUN npm ci --only=production && npm cache clean --force
#RUN npm install --ignore-scripts --force
#
## Copy built application
#COPY --from=builder /app/dist ./dist
#
## Create non-root user and set ownership
#RUN addgroup -g 1001 -S nodejs && \
#    adduser -S nodejs -u 1001 && \
#    chown -R nodejs:nodejs /app
#
#USER nodejs
#EXPOSE 3000
#ENV NODE_ENV=production
#
#CMD ["npm", "start"]
