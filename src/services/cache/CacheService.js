const redis = require('redis');
const config = require('../../utils/config');

class CacheService {
  constructor() {
    this._client = redis.createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password || undefined,
    });

    this._client.on('error', (error) => {
      console.error('Redis Client Error:', error);
    });

    this._client.connect();
  }

  async set(key, value, expirationInSecond = 1800) {
    await this._client.set(key, value, {
      EX: expirationInSecond,
    });
  }

  async get(key) {
    const result = await this._client.get(key);

    if (result === null) {
      throw new Error('Cache tidak ditemukan');
    }

    return result;
  }

  async delete(key) {
    await this._client.del(key);
  }
}

module.exports = CacheService;
