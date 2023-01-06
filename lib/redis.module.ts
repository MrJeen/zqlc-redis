import { DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { REDIS_SERVICE_TOKEN } from './redis.constans';
import { RedisModuleOptions } from './redis.interface';
import { RedisService } from './redis.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    {
      provide: REDIS_SERVICE_TOKEN,
      inject: [SchedulerRegistry],
      useFactory: () => new RedisService(new SchedulerRegistry()),
    },
  ],
})
export class RedisModule {
  static forRoot(options: RedisModuleOptions = {}): DynamicModule {
    return {
      module: RedisModule,
      global: options.isGlobal,
      providers: [RedisService],
      exports: [RedisService],
    };
  }
}
