import { HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ColorTypesEntity } from 'src/entities/color-types.entity';
import { ProductTypesEntity } from 'src/entities/product-types.entity';
import { SizeTypesEntity } from 'src/entities/size-types.entity';
import { ICreateProductType, IGetProductType } from 'src/interfaces/product-type.interface';
import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { ColorTypesService } from '../color-types/color-types.service';
import { SizeTypesService } from '../size-types/size-types.service';
import { instanceToPlain } from 'class-transformer';
import { ProductTypesSerializer } from 'src/serializer/product-types/product-types.serializer';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { createSubquery } from 'src/common/helpers/query.helper';

@Injectable()
export class ProductTypesService {
  constructor(
    @InjectRepository(SizeTypesEntity)
    private readonly sizeTypesRepository: Repository<SizeTypesEntity>,
    @InjectRepository(ProductTypesEntity)
    private readonly productTypesRepository: Repository<ProductTypesEntity>,
    @InjectRepository(ColorTypesEntity)
    private readonly colorTypesRepository: Repository<ColorTypesEntity>,
    private readonly productService: ProductsService,
    private readonly colorTypesService: ColorTypesService,
    private readonly sizeTypesService: SizeTypesService
  ) {}
  private readonly logger = new Logger(ProductTypesService.name, { timestamp: true });

  async createProductTypes(payload: { data: ICreateProductType }) {
    const { data } = payload;

    await this.productService.findProductById({ productId: data.productId });

    await this.colorTypesService.findColorTypesById({ id: data.colorTypeId });

    await this.sizeTypesService.findSizeTypesById({ id: data.sizeTypeId });

    const productType = this.productTypesRepository.create(data);
    const result = await this.productTypesRepository.save(productType);

    return instanceToPlain(new ProductTypesSerializer(result));
  }

  async getProductType(payload: { productId: string }) {
    const { productId } = payload;

    const colorSubquery = createSubquery(ColorTypesEntity, 'ct') // ct = color_types
      .select([
        { field: 'ct.id', alias: 'id' },
        { field: 'ct.colorCode', alias: 'colorCode' },
        { field: 'ct.name', alias: 'name' },
      ])
      .where('ct.id = pt.colorTypeId')
      .as('color');

    const sizeSubquery = createSubquery(SizeTypesEntity, 'st') // st = size_types
      .select([
        { field: 'st.id', alias: 'id' },
        { field: 'st.sizeCode', alias: 'sizeCode' },
        { field: 'st.sizeType', alias: 'sizeType' },
        { field: 'st.name', alias: 'name' },
      ])
      .where('st.id = pt.sizeTypeId')
      .as('size');

    const queryBuilder = this.productTypesRepository
      .createQueryBuilder('pt') // pt = product_types
      .select(['pt.id as id', 'pt.quantity as quantity'])
      .addSelect(colorSubquery.build<ColorTypesEntity>(), 'color')
      .addSelect(sizeSubquery.build<SizeTypesEntity>(), 'size')
      .where('pt.productId = :productId', {
        productId,
      });

    const result = await queryBuilder.getRawMany<IGetProductType>();
    return result.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      color: item.color?.[0],
      size: item.size?.[0],
    }));
  }

  async deleteProductType(payload: { productTypeId: string }) {
    const label = '[deleteProductType]';
    const { productTypeId } = payload;

    const existedProductType = await this.productTypesRepository.findOneBy({ id: productTypeId });
    this.logger.debug(`${label} existedProductType -> ${JSON.stringify(existedProductType)}`);
    if (!existedProductType) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.PRODUCT_TYPE.NOT_FOUND.message,
        code: HTTP_RESPONSE.PRODUCT_TYPE.NOT_FOUND.code,
      });
    }

    await this.productTypesRepository.softDelete({ id: productTypeId });

    return true;
  }
}
