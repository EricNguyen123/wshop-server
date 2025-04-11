import { z } from 'zod';
import { MESSAGES } from 'src/messages/common.message';

export const verifyEmailSchema = z.object({
  email: z.string().trim().email(MESSAGES.ZOD.AUTH.REGISTER.EMAIL.INVALID),
  token: z.string().trim(),
});

export type DRegister = z.infer<typeof verifyEmailSchema>;
