import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_DEFAULT_NAME, REDIS_SERVICE_TOKEN } from './redis.constans';
import { RedisClients } from './redis.provider';
import crypto from 'crypto';

@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_SERVICE_TOKEN) private readonly redisClients: RedisClients,
  ) {}

  getClient(name = REDIS_DEFAULT_NAME): Redis {
    const client = this.redisClients.get(name);
    if (!client) {
      throw new Error(`client ${name} does not exist`);
    }
    return client;
  }

  /**
   * 非持续性锁
   * @param key
   * @param value
   * @param seconds
   * @returns
   */
  async unsustainableLock(client: Redis, key: string, seconds = 3) {
    return await client.set(key, 1, 'EX', seconds, 'NX');
  }

  /**
   * 加锁
   * @param key
   * @param value
   * @param seconds
   * @returns
   */
  async lock(client: Redis, key: string, seconds = 30) {
    const value = crypto.randomUUID();
    const lock = await client.set(key, value, 'EX', seconds, 'NX');
    if (lock) {
      this.watch(client, key, value, seconds);
      return value;
    } else {
      return null;
    }
  }

  /**
   * 释放锁
   * @param key
   * @param value
   * @returns
   */
  async unlock(client: Redis, key: string, value: string) {
    const lua =
      "if redis.call('exists',KEYS[1]) == 1 and redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return nil end";
    return await client.eval(lua, 1, key, value);
  }

  /**
   * 看门狗实现
   * @param key
   * @param value
   * @param seconds
   */
  watch(client: Redis, key: string, value: string, seconds: number) {
    const interval = async () => {
      const lua =
        "if redis.call('exists',KEYS[1]) == 1 and redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('expire', KEYS[1], ARGV[2]) else return nil end";
      const result = await client.eval(lua, 1, key, value, seconds);
      if (result === null && intervalId != undefined) {
        clearInterval(intervalId);
      }
    };
    // 启动定时器
    const intervalId = setInterval(interval, Math.floor((seconds * 1000) / 2));
  }
}
