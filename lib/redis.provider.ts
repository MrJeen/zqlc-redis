import { FactoryProvider, Provider, ValueProvider } from '@nestjs/common';
import {
  REDIS_DEFAULT_NAME,
  REDIS_MODULE_OPTIONS,
  REDIS_SERVICE_TOKEN,
} from './redis.constans';
import { RedisModuleAsyncOptions, RedisModuleOptions } from './redis.interface';
import Redis from 'ioredis';

export type RedisClients = Map<string, Redis>;

export const createOptionsProvider = (
  options: RedisModuleOptions,
): ValueProvider<RedisModuleOptions> => ({
  provide: REDIS_MODULE_OPTIONS,
  useValue: options,
});

export const createAsyncOptionsProvider = (
  options: RedisModuleAsyncOptions,
): Provider => {
  return {
    provide: REDIS_MODULE_OPTIONS,
    useFactory: options.useFactory,
    inject: options.inject,
  };
};

export const RedisProvider: FactoryProvider<RedisClients> = {
  provide: REDIS_SERVICE_TOKEN,
  useFactory: async (options: RedisModuleOptions) => {
    const clients = new Map<string, Redis>();

    if (Array.isArray(options?.clientOptions)) {
      await Promise.all(
        options.clientOptions.map(async (option) => {
          const name = option.name || REDIS_DEFAULT_NAME;
          if (clients.has(name)) {
            throw new Error(`client ${name} is exists`);
          }
          clients.set(name, new Redis(option?.options ?? {}));
        }),
      );
    } else {
      const name = options?.clientOptions?.name || REDIS_DEFAULT_NAME;
      clients.set(name, new Redis(options?.clientOptions?.options ?? {}));
    }

    return clients;
  },
  inject: [REDIS_MODULE_OPTIONS],
};
