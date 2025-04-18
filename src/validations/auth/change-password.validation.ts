import { z } from 'zod';
import { MESSAGES } from 'src/messages/common.message';
import { strongPassword } from '../base.validation';

export const changePasswordSchema = z
  .object({
    id: z.string().trim().uuid(MESSAGES.ZOD.AUTH.REGISTER.ID.INVALID),
    currentPassword: strongPassword,
    password: strongPassword,
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: MESSAGES.ZOD.AUTH.REGISTER.CONFIRM_PASSWORD,
    path: ['confirmPassword'],
  });

export type DChangePassword = z.infer<typeof changePasswordSchema>;
