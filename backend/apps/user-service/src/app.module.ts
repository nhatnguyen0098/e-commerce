import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RpcAuthGuard } from '@common/guards/rpc-auth.guard';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    {
      provide: APP_GUARD,
      useClass: RpcAuthGuard,
    },
  ],
})
export class AppModule {}
