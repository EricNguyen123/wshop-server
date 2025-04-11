import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { envs } from 'src/config/envs';
import { HTTP_RESPONSE } from 'src/constants/http-response';
import { DSendMail } from 'src/dto/mailer/send-mail.dto';

@Injectable()
export class MailerService {
  constructor(private readonly configService: ConfigService) {}
  private readonly logger = new Logger(MailerService.name, { timestamp: true });
  mailTransport() {
    const transporter = nodemailer.createTransport({
      host: envs.mailHost,
      port: envs.mailPort,
      secure: false,
      auth: {
        user: envs.mailUsername,
        pass: envs.mailPassword,
      },
    });
    return transporter;
  }

  async sendMail(payload: { data: DSendMail }) {
    const label = '[sendMail]';

    const { data } = payload;
    const transport = this.mailTransport();

    const mailOptions: Mail.Options = {
      from: data.from ?? {
        name: envs.appName,
        address: envs.mailFromAddress,
      },
      to: data.recipients,
      subject: data.subject,
      html: data.html,
    };

    try {
      const result = await transport.sendMail(mailOptions);
      return result;
    } catch (error) {
      this.logger.log(`${label} error: ${JSON.stringify(error)}`);
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        message: HTTP_RESPONSE.MAILER.SEND_ERROR.message,
        code: HTTP_RESPONSE.MAILER.SEND_ERROR.code,
      });
    }
  }
}
