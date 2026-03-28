import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthServiceClientModule } from './integrations/auth-service/auth-service-client.module';
import { AuthGuard } from './common/guards/auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    AuthServiceClientModule,
    AuthModule,
    CatalogModule,
    UsersModule,
    OrdersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
