import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor () {
    this.client = createClient();
    this.client.on('error', (err) => console.log(`Redis client not connected to the server: ${err}`));
  }

  isAlive () {
    return this.client.connected;
  }

  async get (key) {
    const value = await promisify(this.client.get).bind(this.client)(key);
    return value;
  }

  async set (key, value, duration) {
    await promisify(this.client.setex).bind(this.client)(key, duration, value);
  }

  async del (key) {
    await promisify(this.client.del).bind(this.client)(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
