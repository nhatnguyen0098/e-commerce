import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RpcAuthGuard } from '@common/guards/rpc-auth.guard';
import { RedisModule } from '@common/redis/redis.module';
import { ProductController } from './product.controller';
import { ProductRepository } from './product.repository';
import { ProductService } from './product.service';

@Module({
  imports: [RedisModule],
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductRepository,
    {
      provide: APP_GUARD,
      useClass: RpcAuthGuard,
    },
  ],
})
export class AppModule {}
