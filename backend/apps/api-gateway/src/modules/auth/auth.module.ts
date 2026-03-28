import { Module } from '@nestjs/common';
import { AuthServiceClientModule } from '../../integrations/auth-service/auth-service-client.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [AuthServiceClientModule],
  controllers: [AuthController],
})
export class AuthModule {}
