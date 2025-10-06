import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL;
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

let client;

if (REDIS_URL) {
  client = createClient({
    url: REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
    }
  });
} else {
  const options = {
    socket: {
      host: REDIS_HOST,
      port: Number(REDIS_PORT),
      reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
    }
  };
  if (REDIS_PASSWORD) options.password = REDIS_PASSWORD;
  client = createClient(options);
}

client.on('error', (err) => console.error('Redis Client Error:', err));
client.on('connect', () => console.log('Redis connecting...'));
client.on('ready', () => console.log('Redis ready'));
client.on('end', () => console.log('Redis connection closed'));

async function connectSafe() {
  try {
    if (!client.isOpen) await client.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
}
connectSafe();

export function getRedisClient() {
  return client;
}

export default client;