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
    const sortOrder = order?.toUpperCase() === SORT.DESC ? 'DESC' : 'ASC';

    try {
      if (field.includes('.')) {
        queryBuilder.orderBy(field, sortOrder);
      } else {
        queryBuilder.orderBy(`${queryBuilder.alias}.${field}`, sortOrder);
      }
    } catch {
      queryBuilder.orderBy(`${queryBuilder.alias}.created_at`, 'DESC');
    }
  } else {
    queryBuilder.orderBy(`${queryBuilder.alias}.created_at`, 'DESC');
  }

  queryBuilder.offset((page - 1) * limit).limit(limit);

  const data = await queryBuilder.getRawMany();

  const countQueryBuilder = queryBuilder.clone();
  countQueryBuilder
    .offset(undefined)
    .limit(undefined)
    .orderBy()
    .select('COUNT(DISTINCT ' + queryBuilder.alias + '.id)', 'count');

  const totalResult: { count: string } | undefined = await countQueryBuilder.getRawOne();
  const total = parseInt(totalResult?.count || '0');

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
