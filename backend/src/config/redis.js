import { Redis } from "ioredis";

const redisHost = process.env.REDIS_HOST || "127.0.0.1"; //before production remider update 
const redisPort = Number(process.env.REDIS_PORT) || 6379
const redisPassword = process.env.REDIS_PASS || undefined;


export const redisOptions = {
    host: redisHost,
    port: redisPort,
    maxRetriesPerRequest: null,
    enableReadyCheck: false, 
    password: redisPassword,
       retryStrategy(times) {
        if (times > 6) return null; // 3 baar try karne ke baad retry stop karega
        return 2000;
    },

     reconnectOnError(err) {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true; // Reconnect if read-only failover happens
    }
    return false;
  },
}

export const redisConnection = new Redis(redisOptions);

redisConnection.on('connect',()=>{
    console.log('Redis Connected')
})

redisConnection.on('error',(err)=>{
    console.log('Redis Error',err)
})

redisConnection.on('reconnecting',()=>{
    console.log('Redis Reconnecting')
})