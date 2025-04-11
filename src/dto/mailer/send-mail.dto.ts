import { Address } from 'nodemailer/lib/mailer';

export class DSendMail {
  from?: Address;
  recipients: Address[];
  subject: string;
  html: string;
  text?: string;
  placeholderReplacements?: Record<string, string>;
}
