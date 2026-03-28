import { Module } from '@nestjs/common';
import { UserServiceClientModule } from '../../integrations/user-service/user-service-client.module';
import { UsersController } from './users.controller';

@Module({
  imports: [UserServiceClientModule],
  controllers: [UsersController],
})
export class UsersModule {}
