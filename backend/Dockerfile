FROM node:20-alpine


# 1. Runtime dependencies: FFmpeg aur GNU coreutils (nice command ke liye)
RUN apk update && apk add --no-cache \
    ffmpeg \
    coreutils

# 2. Build-only dependencies: Argon2 compile karne ke liye temporary tools
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++


WORKDIR /app


# 3. Layer caching & non-root ownership during copy
COPY --chown=node:node package*.json ./

# 4. Production dependencies install karein aur compile hote hi compilers delete kar dein
RUN npm ci --omit=dev && \
    apk del .build-deps

# 5. Application source code copy karein (as 'node' user)
COPY --chown=node:node . .

# 6. Shared uploads folder create karein aur node user ko access dein
RUN mkdir -p /tmp/uploads && chown -R node:node /tmp/uploads

# 7. Non-root user par switch karein (CIS Docker Benchmark 4.1)
USER node

ENV NODE_ENV=production
EXPOSE 5000

# 8. Default execution
CMD ["node", "src/server.js"]


