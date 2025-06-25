import { HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import { paginate } from 'src/common/helpers/paginate.helper';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { DQueryGetListColorTypes } from 'src/dto/color-types/query-get-list-color-types.dto';
import { ColorTypesEntity } from 'src/entities/color-types.entity';
import { ProductTypesEntity } from 'src/entities/product-types.entity';
import { ICreateColorType, IUpdateColorType } from 'src/interfaces/color-type.interface';
import { ColorTypesSerializer } from 'src/serializer/color-types/color-types.serializer';
import { DataSource, ILike, Repository } from 'typeorm';

@Injectable()
export class ColorTypesService {
  constructor(
    @InjectRepository(ColorTypesEntity)
    private readonly colorTypesRepository: Repository<ColorTypesEntity>,
    @InjectRepository(ProductTypesEntity)
    private readonly productTypesRepository: Repository<ProductTypesEntity>,
    private dataSource: DataSource
  ) {}
  private readonly logger = new Logger(ColorTypesService.name, { timestamp: true });

  async createColorTypes(payload: { data: ICreateColorType }) {
    const { data } = payload;
    const colorType = this.colorTypesRepository.create({
      colorCode: data.colorCode,
      name: data.name,
    });
    const result = await this.colorTypesRepository.save(colorType);
    return instanceToPlain(new ColorTypesSerializer(result));
  }

  async getColorTypes(payload: { query: DQueryGetListColorTypes }) {
    const label = '[getColorTypes]';
    const { textSearch, ...pagination } = payload.query;

    const queryBuilder = this.colorTypesRepository
      .createQueryBuilder('c') // c = color_types
      .select([
        'c.id as id',
        'c.colorCode as colorCode',
        'c.name as name',
        'c.createdAt as createdAt',
        'c.updatedAt as updatedAt',
      ]);

    const conditions: Record<string, any> = {};

    const valueSearch = textSearch?.trim();
    if (valueSearch) {
      conditions.name = ILike(`%${valueSearch}%`);
    }

    if (Object.keys(conditions).length > 0) {
      queryBuilder.andWhere(conditions);
    }

    const result = await paginate(queryBuilder, pagination);
    this.logger.debug(`${label} result: ${JSON.stringify(result)}`);

    return {
      ...result,
      data: result.data.map((c: Partial<ColorTypesEntity>) => {
        const bannerData = instanceToPlain(new ColorTypesSerializer(c));
        return bannerData;
      }),
    };
  }

  async updateColorTypes(payload: { id: string; data: IUpdateColorType }) {
    const { id, data } = payload;
    const existedColorType = await this.colorTypesRepository.findOneBy({ id });
    if (!existedColorType) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.COLOR_TYPE.NOT_FOUND.message,
        code: HTTP_RESPONSE.COLOR_TYPE.NOT_FOUND.code,
      });
    }
    if (data.colorCode !== undefined) {
      existedColorType.colorCode = data.colorCode;
    }
    if (data.name !== undefined) {
      existedColorType.name = data.name;
    }
    const result = await this.colorTypesRepository.save(existedColorType);
    return instanceToPlain(new ColorTypesSerializer(result));
  }

  async deleteColorTypes(payload: { id: string }) {
    const { id } = payload;
    const existedColorType = await this.colorTypesRepository.findOneBy({ id });
    if (!existedColorType) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.COLOR_TYPE.NOT_FOUND.message,
        code: HTTP_RESPONSE.COLOR_TYPE.NOT_FOUND.code,
      });
    }

    const existedProductType = await this.productTypesRepository.findOneBy({
      colorTypeId: id,
    });
    if (existedProductType) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.COLOR_TYPE.EXISTED_COLOR_TYPE.message,
        code: HTTP_RESPONSE.COLOR_TYPE.EXISTED_COLOR_TYPE.code,
      });
    }

    await this.colorTypesRepository.softDelete(id);
    return true;
  }

  async findColorTypesById(payload: { id: string }) {
    const { id } = payload;
    const existedColorType = await this.colorTypesRepository.findOneBy({ id });
    if (!existedColorType) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.COLOR_TYPE.NOT_FOUND.message,
        code: HTTP_RESPONSE.COLOR_TYPE.NOT_FOUND.code,
      });
    }

    return existedColorType;
  }
}
