FROM node:20-alpine

WORKDIR /app

# Copy only manifest files first so `npm ci` is cached by Docker unless
# dependencies actually changed -- rebuilds after a plain code edit are fast.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
RUN apk add --no-cache ffmpeg 

COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/server.js"]


