import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { connectKafkaClientWithRetry } from '@common/utils/connect-kafka-client-with-retry';
import { requestKafkaRpc } from '@common/utils/request-kafka-rpc';
import {
  CATALOG_MESSAGE_PATTERN,
  type CatalogCategoryDto,
  type CatalogGetProductBySlugRequest,
  type CatalogListProductsRequest,
  type CatalogListProductsResponse,
  type CatalogProductDetailDto,
} from '@contracts/catalog/catalog.contracts';

@Injectable()
export class CatalogGatewayService implements OnModuleInit {
  constructor(
    @Inject('PRODUCT_SERVICE_CLIENT')
    private readonly productServiceClient: ClientKafka,
  ) {}
  public async onModuleInit(): Promise<void> {
    this.productServiceClient.subscribeToResponseOf(
      CATALOG_MESSAGE_PATTERN.listCategories,
    );
    this.productServiceClient.subscribeToResponseOf(
      CATALOG_MESSAGE_PATTERN.listBrands,
    );
    this.productServiceClient.subscribeToResponseOf(
      CATALOG_MESSAGE_PATTERN.listProducts,
    );
    this.productServiceClient.subscribeToResponseOf(
      CATALOG_MESSAGE_PATTERN.getProductBySlug,
    );
    await connectKafkaClientWithRetry({ client: this.productServiceClient });
  }

  public listCategories(): Promise<CatalogCategoryDto[]> {
    return requestKafkaRpc<CatalogCategoryDto[], Record<string, never>>({
      client: this.productServiceClient,
      pattern: CATALOG_MESSAGE_PATTERN.listCategories,
      payload: {},
      timeoutMs: 8000,
    });
  }

  public listBrands(): Promise<string[]> {
    return requestKafkaRpc<string[], Record<string, never>>({
      client: this.productServiceClient,
      pattern: CATALOG_MESSAGE_PATTERN.listBrands,
      payload: {},
      timeoutMs: 8000,
    });
  }

  public listProducts(
    input: CatalogListProductsRequest,
  ): Promise<CatalogListProductsResponse> {
    return requestKafkaRpc<
      CatalogListProductsResponse,
      CatalogListProductsRequest
    >({
      client: this.productServiceClient,
      pattern: CATALOG_MESSAGE_PATTERN.listProducts,
      payload: input,
      timeoutMs: 8000,
    });
  }

  public getProductBySlug(
    slug: string,
  ): Promise<CatalogProductDetailDto | null> {
    const payload: CatalogGetProductBySlugRequest = { slug };
    return requestKafkaRpc<
      CatalogProductDetailDto | null,
      CatalogGetProductBySlugRequest
    >({
      client: this.productServiceClient,
      pattern: CATALOG_MESSAGE_PATTERN.getProductBySlug,
      payload,
      timeoutMs: 8000,
    });
  }
}
