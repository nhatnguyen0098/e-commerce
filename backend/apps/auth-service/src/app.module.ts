import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { getJwtSecret } from '@common/configs/get-jwt-secret';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserServiceClientModule } from './user-service-client.module';

@Module({
  imports: [
    UserServiceClientModule,
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: {
        expiresIn: getJwtExpiresIn(),
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AppModule {}

function getJwtExpiresIn(): StringValue {
  const defaultValue: StringValue = '1h';
  const configuredValue: string | undefined = process.env.AUTH_JWT_EXPIRES_IN;
  if (configuredValue && configuredValue.trim().length > 0) {
    return configuredValue as StringValue;
  }
  return defaultValue;
}
