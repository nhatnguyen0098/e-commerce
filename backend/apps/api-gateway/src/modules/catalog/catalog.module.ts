import { Module } from '@nestjs/common';
import { ProductServiceClientModule } from '../../integrations/product-service/product-service-client.module';
import { CatalogController } from './catalog.controller';

@Module({
  imports: [ProductServiceClientModule],
  controllers: [CatalogController],
})
export class CatalogModule {}
