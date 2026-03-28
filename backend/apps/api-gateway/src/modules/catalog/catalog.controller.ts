import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { catalogListCursorCodec } from '@common/utils/catalog-list-cursor.codec';
import { Public } from '../../common/decorators/public.decorator';
import { CatalogGatewayService } from '../../integrations/product-service/catalog-gateway.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogGatewayService: CatalogGatewayService) {}

  @Public()
  @Get('categories')
  public listCategories() {
    return this.catalogGatewayService.listCategories();
  }

  @Public()
  @Get('brands')
  public listBrands() {
    return this.catalogGatewayService.listBrands();
  }

  @Public()
  @Get('products')
  public listProducts(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const limitParsed: number = Number.parseInt(limitRaw ?? '24', 10);
    const limit: number =
      Number.isFinite(limitParsed) && limitParsed >= 1
        ? Math.min(48, limitParsed)
        : 24;
    const trimmedCursor: string | undefined =
      cursor !== undefined && cursor.trim().length > 0
        ? cursor.trim()
        : undefined;
    if (trimmedCursor !== undefined) {
      if (catalogListCursorCodec.decode(trimmedCursor) === null) {
        throw new BadRequestException('Invalid cursor');
      }
    }
    return this.catalogGatewayService.listProducts({
      search: q,
      categorySlug: category,
      brand,
      cursor: trimmedCursor,
      limit,
    });
  }

  @Public()
  @Get('products/:slug')
  public async getProductBySlug(@Param('slug') slug: string) {
    const product = await this.catalogGatewayService.getProductBySlug(slug);
    if (product === null) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
