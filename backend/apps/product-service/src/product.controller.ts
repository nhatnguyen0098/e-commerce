import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RpcPublic } from '@common/decorators/rpc-public.decorator';
import { unwrapKafkaMessageEnvelope } from '@common/utils/kafka-message-envelope';
import {
  CATALOG_MESSAGE_PATTERN,
  type CatalogValidateCheckoutLinesRequest,
  type CatalogValidateCheckoutLinesResponse,
  type CatalogCategoryDto,
  type CatalogGetProductBySlugRequest,
  type CatalogListProductsRequest,
  type CatalogListProductsResponse,
  type CatalogProductDetailDto,
} from '@contracts/catalog/catalog.contracts';
import { ProductService } from './product.service';

@RpcPublic()
@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @MessagePattern(CATALOG_MESSAGE_PATTERN.listCategories)
  public listCategories(): Promise<CatalogCategoryDto[]> {
    return this.productService.listCategories();
  }

  @MessagePattern(CATALOG_MESSAGE_PATTERN.listBrands)
  public listBrands(): Promise<string[]> {
    return this.productService.listBrands();
  }

  @MessagePattern(CATALOG_MESSAGE_PATTERN.listProducts)
  public listProducts(
    @Payload() payload: CatalogListProductsRequest,
  ): Promise<CatalogListProductsResponse> {
    return this.productService.listProducts(payload);
  }

  @MessagePattern(CATALOG_MESSAGE_PATTERN.getProductBySlug)
  public getProductBySlug(
    @Payload() payload: CatalogGetProductBySlugRequest,
  ): Promise<CatalogProductDetailDto | null> {
    return this.productService.getProductBySlug(payload.slug);
  }

  @MessagePattern(CATALOG_MESSAGE_PATTERN.validateCheckoutLines)
  public validateCheckoutLines(
    @Payload()
    payload:
      | CatalogValidateCheckoutLinesRequest
      | {
          readonly key: string;
          readonly value: CatalogValidateCheckoutLinesRequest;
        },
  ): Promise<CatalogValidateCheckoutLinesResponse> {
    const resolvedPayload: CatalogValidateCheckoutLinesRequest =
      unwrapKafkaMessageEnvelope<CatalogValidateCheckoutLinesRequest>(payload);
    return this.productService.validateCheckoutLines(resolvedPayload.items);
  }
}
