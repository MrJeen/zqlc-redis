import { ModuleMetadata } from '@nestjs/common';
import { RedisOptions } from 'ioredis';

export interface RedisClientOptions {
  name?: string;
  options?: RedisOptions;
}

export interface RedisModuleOptions {
  isGlobal?: boolean;
  clientOptions?: RedisClientOptions | RedisClientOptions[];
}

export interface RedisModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  isGlobal?: boolean;
  useFactory: (
    ...args: any[]
  ) => RedisModuleOptions | Promise<RedisModuleOptions>;
  inject?: any[];
}
