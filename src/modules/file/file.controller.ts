import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  Res,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FileService } from './file.service';
import { ApiTags, ApiConsumes, ApiBody, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import * as fs from 'fs';
import { multerConfig } from 'src/config/multer/multer.config';
import { DUploadFile } from 'src/dto/file/upload-file.dto';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { DUploadFileRes } from 'src/dto/file/upload-file-res.dto';
import { DGetFileRes } from 'src/dto/file/get-file-res.dto';
import { DDeleteFileRes } from 'src/dto/file/delete-file-res.dto';

@ApiTags('files')
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        name: { type: 'string' },
        recordType: { type: 'string' },
        recordId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Upload file successfully', type: DUploadFileRes })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() uploadFileDto: DUploadFile) {
    const result = await this.fileService.uploadFile({ file, uploadFileDto });
    return {
      status: HttpStatus.CREATED,
      message: HTTP_RESPONSE.COMMON.CREATED.message,
      code: HTTP_RESPONSE.COMMON.CREATED.code,
      data: {
        id: result.id,
        name: result.name,
        recordType: result.recordType,
        recordId: result.recordId,
        blob: {
          id: result.activeStorageBlob.id,
          filename: result.activeStorageBlob.filename,
          contentType: result.activeStorageBlob.contentType,
          byteSize: result.activeStorageBlob.byteSize,
        },
        createdAt: result.createdDate,
      },
    };
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Get file successfully', type: DGetFileRes })
  async getFile(@Param('id', ParseUUIDPipe) id: string) {
    const fileData = await this.fileService.getFileById({ id });
    const result = {
      attachment: {
        id: fileData.attachment.id,
        name: fileData.attachment.name,
        recordType: fileData.attachment.recordType,
        recordId: fileData.attachment.recordId,
        createdAt: fileData.attachment.createdDate,
      },
      blob: {
        id: fileData.blob.id,
        filename: fileData.blob.filename,
        contentType: fileData.blob.contentType,
        byteSize: fileData.blob.byteSize,
        createdAt: fileData.blob.createdDate,
      },
    };

    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.GET_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.GET_SUCCESS.code,
      data: result,
    };
  }

  @Get('download/:id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async downloadFile(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const fileData = await this.fileService.getFileById({ id });
    const filePath = this.fileService.getFilePath(fileData.blob.key);

    if (!fs.existsSync(filePath)) {
      return res.status(HttpStatus.NOT_FOUND).json({
        message: HTTP_RESPONSE.FILE.FILE_NOT_FOUND.message,
        code: HTTP_RESPONSE.FILE.FILE_NOT_FOUND.code,
      });
    }

    res.setHeader('Content-Type', fileData.blob.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileData.blob.filename}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Get()
  @ApiQuery({ name: 'recordType', required: true })
  @ApiQuery({ name: 'recordId', required: true })
  @ApiResponse({ status: 200, description: 'Get files successfully', type: DUploadFileRes })
  async getFilesByRecord(
    @Query('recordType') recordType: string,
    @Query('recordId', ParseUUIDPipe) recordId: string
  ) {
    const attachments = await this.fileService.getFilesByRecord({ recordType, recordId });
    const result = attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      recordType: attachment.recordType,
      recordId: attachment.recordId,
      blob: {
        id: attachment.activeStorageBlob.id,
        filename: attachment.activeStorageBlob.filename,
        contentType: attachment.activeStorageBlob.contentType,
        byteSize: attachment.activeStorageBlob.byteSize,
      },
      createdAt: attachment.createdDate,
    }));

    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.COMMON.GET_SUCCESS.message,
      code: HTTP_RESPONSE.COMMON.GET_SUCCESS.code,
      data: result,
    };
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Delete file successfully', type: DDeleteFileRes })
  async deleteFile(@Param('id', ParseUUIDPipe) id: string) {
    await this.fileService.deleteFile({ id });
    return {
      status: HttpStatus.OK,
      message: HTTP_RESPONSE.FILE.DELETE_SUCCESS.message,
      code: HTTP_RESPONSE.FILE.DELETE_SUCCESS.code,
    };
  }
}
