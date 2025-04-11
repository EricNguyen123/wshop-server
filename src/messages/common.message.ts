import { ValidationConfig } from 'src/constants/common';

export const MESSAGES = {
  ZOD: {
    AUTH: {
      REGISTER: {
        ID: { INVALID: 'Invalid id' },
        NAME: { SHORT: 'Name is too short' },
        EMAIL: { INVALID: 'Invalid email' },
        PASSWORD: {
          SHORT: `Password must be at least ${ValidationConfig.LENGTH_STRING} characters long`,
          MIN_LENGTH_LOW_CASE: `Password must contain at least ${ValidationConfig.MIN_LENGTH_LOW_CASE} lowercase letter`,
          MIN_LENGTH_UP_CASE: `Password must contain at least ${ValidationConfig.MIN_LENGTH_UP_CASE} uppercase letter`,
          MIN_LENGTH_NUMBER: `Password must contain at least ${ValidationConfig.MIN_LENGTH_NUMBER} number`,
          MIN_SYMBOL: `Password must contain at least ${ValidationConfig.MIN_SYMBOL} symbol`,
        },
        CONFIRM_PASSWORD: 'Confirm password is required',
      },
    },
  },
};
