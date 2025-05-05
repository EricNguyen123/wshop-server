import { ApiPropertyOptional } from '@nestjs/swagger';

export class DBaseQuery {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Number of items per page' })
  limit?: number;

  @ApiPropertyOptional({ example: 'search', description: 'Text to search' })
  textSearch?: string;

  @ApiPropertyOptional({ example: 'id,desc', description: 'Sort format: field,order' })
  sort?: string;

  [key: string]: any;
}
