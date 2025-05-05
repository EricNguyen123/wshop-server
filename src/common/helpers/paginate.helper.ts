import { DEFAULT_LIMIT, DEFAULT_PAGE, SORT } from 'src/constants/base.constant';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

interface PaginateOptions {
  page?: number;
  limit?: number;
  sort?: string;
}

export async function paginate<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  options: PaginateOptions
) {
  const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, sort } = options;

  if (sort) {
    const [field, order] = sort.split(',');
    queryBuilder.orderBy(
      `${queryBuilder.alias}.${field}`,
      (order?.toUpperCase() === SORT.DESC ? SORT.DESC : SORT.ASC) as 'ASC' | 'DESC'
    );
  } else {
    queryBuilder.orderBy(`${queryBuilder.alias}.created_at`, SORT.DESC as 'ASC' | 'DESC');
  }

  queryBuilder.skip((page - 1) * limit).take(limit);

  const [data, total] = await queryBuilder.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
