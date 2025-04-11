import { z } from 'zod';
import { ValidationConfig } from 'src/constants/common';
import { MESSAGES } from 'src/messages/common.message';
import { strongPassword } from '../base.validation';

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(ValidationConfig.MIN_LENGTH_STRING, MESSAGES.ZOD.AUTH.REGISTER.NAME.SHORT),

    email: z.string().trim().email(MESSAGES.ZOD.AUTH.REGISTER.EMAIL.INVALID),

    password: strongPassword,

    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: MESSAGES.ZOD.AUTH.REGISTER.CONFIRM_PASSWORD,
    path: ['confirmPassword'],
  });

export type DRegister = z.infer<typeof registerSchema>;
