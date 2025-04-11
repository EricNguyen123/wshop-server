import { ValidationConfig } from 'src/constants/common';
import regexPatternConstant from 'src/constants/regex-pattern.constant';
import { MESSAGES } from 'src/messages/common.message';
import { z } from 'zod';

export const strongPassword = z
  .string()
  .trim()
  .min(ValidationConfig.LENGTH_STRING, MESSAGES.ZOD.AUTH.REGISTER.PASSWORD.SHORT)
  .refine((val) => regexPatternConstant.alphaLowerCase.test(val), {
    message: MESSAGES.ZOD.AUTH.REGISTER.PASSWORD.MIN_LENGTH_LOW_CASE,
  })
  .refine((val) => regexPatternConstant.alphaUpperCase.test(val), {
    message: MESSAGES.ZOD.AUTH.REGISTER.PASSWORD.MIN_LENGTH_UP_CASE,
  })
  .refine((val) => regexPatternConstant.numbers.test(val), {
    message: MESSAGES.ZOD.AUTH.REGISTER.PASSWORD.MIN_LENGTH_NUMBER,
  })
  .refine((val) => regexPatternConstant.symbols.test(val), {
    message: MESSAGES.ZOD.AUTH.REGISTER.PASSWORD.MIN_SYMBOL,
  });
