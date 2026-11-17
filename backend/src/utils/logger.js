

import pino from 'pino';

function createLogger() {
  const isDev = process.env.NODE_ENV !== 'production';
  const baseConfig = {
    level: isDev ? 'debug' : 'info',
    redact: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["x-refresh-token"]'],
  };

  if (isDev) {
    try {
      return pino({
        ...baseConfig,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      });
    } catch {
      // Container mein pino-pretty na hone par crash nahi hoga
      return pino(baseConfig);
    }
  }

  return pino(baseConfig);
}

export const logger = createLogger();