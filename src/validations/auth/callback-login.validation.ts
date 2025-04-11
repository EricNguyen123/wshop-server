import { z } from 'zod';
import { MESSAGES } from 'src/messages/common.message';

export const callbackLoginSchema = z.object({
  email: z.string().trim().email(MESSAGES.ZOD.AUTH.REGISTER.EMAIL.INVALID),
});

export type DLoginGoogle = z.infer<typeof callbackLoginSchema>;
