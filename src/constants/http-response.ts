export const HTTP_RESPONSE = {
  COMMON: {
    SUCCESS: {
      message: 'Success',
      code: 200,
    },
    CREATED: {
      message: 'Create Success',
      code: 201,
    },
    BAD_REQUEST: {
      message: 'Bad Request',
      code: 400,
    },
    UNAUTHORIZED: {
      message: 'Unauthorized',
      code: 401,
    },
    FORBIDDEN: {
      message: 'Forbidden',
      code: 403,
    },
    NOT_FOUND: {
      message: 'Not Found',
      code: 404,
    },
    INTERNAL_SERVER_ERROR: {
      message: 'Internal Server Error',
      code: 500,
    },
    CREATE_SUCCESS: {
      message: 'Created Successfully',
      code: 1000,
    },
    UPDATE_SUCCESS: {
      message: 'Updated Successfully',
      code: 1001,
    },
    DELETE_SUCCESS: {
      message: 'Deleted Successfully',
      code: 1002,
    },
    GET_SUCCESS: {
      message: 'Get Successfully',
      code: 1003,
    },
  },

  MAILER: {
    SEND_SUCCESS: {
      message: 'Send mail successfully',
      code: 1004,
    },
    SEND_ERROR: {
      message: 'Email sending failed',
      code: 1005,
    },
  },

  USER: {
    NOT_FOUND: {
      message: 'User not found',
      code: 2000,
    },
    EMAIL_EXISTED: {
      message: 'Email existed',
      code: 2001,
    },
    EXISTED_USER: {
      message: 'User existed',
      code: 2002,
    },
    UPDATE_FAIL: {
      message: 'Update user fail',
      code: 2003,
    },
  },

  AUTH: {
    LOGIN_ERROR: {
      message: 'Incorrect login information',
      code: 3000,
    },
    STATUS_ERROR: {
      message: 'User is not active',
      code: 3001,
    },
    INVALID_TOKEN: {
      message: 'Invalid token',
      code: 3002,
    },
    LOGOUT_SUCCESS: {
      message: 'Logout successful',
      code: 3003,
    },
    CHANGE_PASSWORD_SUCCESS: {
      message: 'Change password successfully',
      code: 3004,
    },
    PASSWORD_ERROR: {
      message: 'Incorrect password',
      code: 3005,
    },
    TOKEN_ERROR: {
      message: 'Invalid token',
      code: 3006,
    },
    SEND_OTP_ERROR: {
      message: 'Failed to send OTP to your email',
      code: 3007,
    },
    SEND_OTP_SUCCESS: {
      message: 'Success send OTP to your email',
      code: 3008,
    },
    VERIFY_OTP_FAIL: {
      message: 'Invalid OTP',
      code: 3009,
    },
    VERIFY_OTP_SUCCESS: {
      message: 'OTP verified successfully',
      code: 3010,
    },
    VERIFY_OTP_EXPIRED: {
      message: 'OTP expired',
      code: 3011,
    },
    LOGIN_SUCCESS: {
      message: 'Login successfully',
      code: 3012,
    },
    REGISTER_SUCCESS: {
      message: 'Register successfully',
      code: 3013,
    },
    REQUIRE_PASSWORD: {
      message: 'Please Provide The Password',
      code: 3014,
    },
  },

  ZOD: {
    VALIDATION_ERROR: {
      message: 'Validation failed',
      code: 4000,
    },
    UNKNOWN_VALIDATION_ERROR: {
      message: 'Unknown validation error',
      code: 4001,
    },
  },
};
