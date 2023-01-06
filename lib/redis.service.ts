import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { SchedulerRegistry } from '@nestjs/schedule';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(private schedulerRegistry: SchedulerRegistry) {}

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
  async watch(client: Redis, key: string, value: string, seconds: number) {
    const name = key + ':' + value;
    const timeout = setTimeout(async () => {
      const lua =
        "if redis.call('exists',KEYS[1]) == 1 and redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('expire', KEYS[1], ARGV[2]) else return nil end";
      const result = await client.eval(lua, 1, key, value, seconds);
      this.schedulerRegistry.deleteTimeout(name);
      if (result !== null) {
        this.watch(client, key, value, seconds);
      }
    }, Math.floor((seconds * 1000) / 3));
    this.schedulerRegistry.addTimeout(name, timeout);
  }
}
