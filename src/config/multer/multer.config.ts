import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { HTTP_RESPONSE } from 'src/constants/http-response';

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, callback) => {
      const uniqueFilename = `${uuidv4()}${extname(file.originalname)}`;
      callback(null, uniqueFilename);
    },
  }),
  fileFilter: (
    req,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void
  ) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|txt)$/)) {
      return callback(
        new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            message: HTTP_RESPONSE.FILE.FILE_TYPE_ERROR.message,
            code: HTTP_RESPONSE.FILE.FILE_TYPE_ERROR.code,
          },
          HttpStatus.BAD_REQUEST
        ),
        false
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};

export const generateFileKey = (filename: string): string => {
  return `${uuidv4()}-${filename}`;
};

export const calculateChecksum = (filePath: string): string => {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
};
