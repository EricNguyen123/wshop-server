/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { ZodError, ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}
  private readonly logger = new Logger(ZodValidationPipe.name, { timestamp: true });

  transform(value: unknown, metadata: ArgumentMetadata) {
    const label = '[transform]';
    try {
      this.logger.log(`${label} value -> ${JSON.stringify(value)}`);
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        throw new BadRequestException({
          status: HttpStatus.BAD_REQUEST,
          code: HTTP_RESPONSE.ZOD.VALIDATION_ERROR.code,
          message: HTTP_RESPONSE.ZOD.VALIDATION_ERROR.message,
          errors: formattedErrors,
        });
      }

      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        code: HTTP_RESPONSE.ZOD.UNKNOWN_VALIDATION_ERROR.code,
        message: HTTP_RESPONSE.ZOD.UNKNOWN_VALIDATION_ERROR.message,
      });
    }
  }
}
