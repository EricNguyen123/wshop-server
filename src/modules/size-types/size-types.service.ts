import { HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain } from 'class-transformer';
import { paginate } from 'src/common/helpers/paginate.helper';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { DQueryGetListSizeTypes } from 'src/dto/size-types/query-get-list-size-types.dto';
import { ProductTypesEntity } from 'src/entities/product-types.entity';
import { SizeTypesEntity } from 'src/entities/size-types.entity';
import { ICreateSizeType, IUpdateSizeType } from 'src/interfaces/size-type.interface';
import { SizeTypesSerializer } from 'src/serializer/size-types/size-types.serializer';
import { DataSource, ILike, Repository } from 'typeorm';

@Injectable()
export class SizeTypesService {
  constructor(
    @InjectRepository(SizeTypesEntity)
    private readonly sizeTypesRepository: Repository<SizeTypesEntity>,
    @InjectRepository(ProductTypesEntity)
    private readonly productTypesRepository: Repository<ProductTypesEntity>,
    private dataSource: DataSource
  ) {}
  private readonly logger = new Logger(SizeTypesService.name, { timestamp: true });

  async createSizeTypes(payload: { data: ICreateSizeType }) {
    const { data } = payload;
    const sizeType = this.sizeTypesRepository.create({
      sizeCode: data.sizeCode,
      sizeType: data.sizeType,
      name: data.name,
    });
    const result = await this.sizeTypesRepository.save(sizeType);
    return instanceToPlain(new SizeTypesSerializer(result));
  }

  async getSizeTypes(payload: { query: DQueryGetListSizeTypes }) {
    const label = '[getSizeTypes]';
    const { textSearch, ...pagination } = payload.query;

    const queryBuilder = this.sizeTypesRepository
      .createQueryBuilder('s') // s = size_types
      .select([
        's.id as id',
        's.sizeCode as sizeCode',
        's.sizeType as sizeType',
        's.name as name',
        's.createdAt as createdAt',
        's.updatedAt as updatedAt',
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
      data: result.data.map((s: Partial<SizeTypesEntity>) => {
        const bannerData = instanceToPlain(new SizeTypesSerializer(s));
        return bannerData;
      }),
    };
  }

  async updateSizeTypes(payload: { id: string; data: IUpdateSizeType }) {
    const { id, data } = payload;
    const existedSizeType = await this.sizeTypesRepository.findOneBy({ id });
    if (!existedSizeType) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.SIZE_TYPE.NOT_FOUND.message,
        code: HTTP_RESPONSE.SIZE_TYPE.NOT_FOUND.code,
      });
    }
    if (data.sizeCode !== undefined) {
      existedSizeType.sizeCode = data.sizeCode;
    }
    if (data.sizeType !== undefined) {
      existedSizeType.sizeType = data.sizeType;
    }
    if (data.name !== undefined) {
      existedSizeType.name = data.name;
    }
    const result = await this.sizeTypesRepository.save(existedSizeType);
    return instanceToPlain(new SizeTypesSerializer(result));
  }

  async deleteSizeTypes(payload: { id: string }) {
    const { id } = payload;
    const existedSizeType = await this.sizeTypesRepository.findOneBy({ id });
    if (!existedSizeType) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.SIZE_TYPE.NOT_FOUND.message,
        code: HTTP_RESPONSE.SIZE_TYPE.NOT_FOUND.code,
      });
    }

    const existedProductType = await this.productTypesRepository.findOneBy({
      sizeTypeId: id,
    });
    if (existedProductType) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.SIZE_TYPE.EXISTED_SIZE_TYPE.message,
        code: HTTP_RESPONSE.SIZE_TYPE.EXISTED_SIZE_TYPE.code,
      });
    }

    await this.sizeTypesRepository.softDelete(id);
    return true;
  }

  async findSizeTypesById(payload: { id: string }) {
    const { id } = payload;
    const existedSizeType = await this.sizeTypesRepository.findOneBy({ id });
    if (!existedSizeType) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        message: HTTP_RESPONSE.SIZE_TYPE.NOT_FOUND.message,
        code: HTTP_RESPONSE.SIZE_TYPE.NOT_FOUND.code,
      });
    }

    return existedSizeType;
  }
}
