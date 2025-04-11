import * as crypto from 'crypto';
import { LENGTH_MAX_OTP, LENGTH_MIN_OTP, LENGTH_OTP_DEFAULT } from 'src/constants/base.constant';

/**
 * Generate a secure numeric OTP (One-Time Password)
 * @param {number} size - The length of the OTP (default is 6).
 * @returns {string} A numeric OTP string of the specified size.
 */
export function generateNumericOtp(size: number = LENGTH_OTP_DEFAULT): string {
  if (size < LENGTH_MIN_OTP || size > LENGTH_MAX_OTP) {
    throw new Error('Size must be between 4 and 10.');
  }

  const max = Math.pow(LENGTH_MAX_OTP, size);
  const min = Math.pow(LENGTH_MAX_OTP, size - 1);
  const randomNumber = crypto.randomInt(min, max);

  return randomNumber.toString();
}
