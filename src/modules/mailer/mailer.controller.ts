import { Body, Controller, Post } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { envs } from 'src/config/envs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DSendMailReq } from 'src/dto/mailer/send-mail-req.dto';
import { DSendMail } from 'src/dto/mailer/send-mail.dto';

@ApiBearerAuth()
@ApiTags('mailer')
@Controller('mailer')
export class MailerController {
  constructor(private readonly mailerService: MailerService) {}

  @Post()
  sendMail(@Body() data: DSendMailReq) {
    const dto: DSendMail = {
      from: { name: envs.appName, address: envs.mailFromAddress },
      recipients: [{ name: data.name || 'Unknown', address: data.email || 'no-reply@example.com' }],
      subject: 'Welcome to WebShop',
      html: `<p>
        <strong>Hi ${data.name}!</strong>
      </p>`,
    };
    return this.mailerService.sendMail({ data: dto });
  }
}
