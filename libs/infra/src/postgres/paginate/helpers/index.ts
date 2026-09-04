import { BasePaginationDto } from '@libs/infra/postgres/paginate/dto/base-pagination.dto';
import { BasePaginationResponseDto } from '../dto/base-pagination-response.dto';

export const transformPaginationRes = <T>(
  data: T[],
  total: number,
  query: BasePaginationDto,
): BasePaginationResponseDto<T> => {
  return {
    items: data,
    meta: {
      total,
      limit: query.limit,
      page: query.page,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};
