import 'dotenv/config';
import * as Joi from 'joi';
import { EnvConfig } from 'src/interfaces/envs';

const envVarsSchema = Joi.object({
  APP_NAME: Joi.string().required(),
  APP_URL: Joi.string().required(),
  FE_URL: Joi.string().required(),
  MYSQL_DB_NAME: Joi.string().required(),
  MYSQL_USERNAME: Joi.string().required(),
  MYSQL_PASSWORD: Joi.string().required(),
  MYSQL_PORT: Joi.number().required(),
  MYSQL_HOST: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  MAIL_ENCRYPTION: Joi.string().required(),
  MAIL_FROM_ADDRESS: Joi.string().required(),
  MAIL_HOST: Joi.string().required(),
  MAIL_MAILER: Joi.string().required(),
  MAIL_PASSWORD: Joi.string().required(),
  MAIL_PORT: Joi.number().required(),
  MAIL_USERNAME: Joi.string().required(),
  BCRYPT_SALT_ROUND: Joi.number().required(),
  PORT: Joi.number().required(),
  DEFAULT_PORT: Joi.number().required(),
  OTP_SIZE: Joi.number().required(),
  OTP_TIMEOUT: Joi.number().required(),
  OTP_TIME_LIMIT: Joi.number().required(),
  OTP_LIMIT: Joi.number().required(),
}).unknown(true);

const result = envVarsSchema.validate(process.env) as {
  error?: Joi.ValidationError;
  value: EnvConfig;
};

if (result?.error) {
  throw new Error(`Config validation error: ${result.error.message}`);
}

const envVars = result.value;

export const envs = {
  appName: envVars.APP_NAME,
  appUrl: envVars.APP_URL,
  feUrl: envVars.FE_URL,
  database: envVars.MYSQL_DB_NAME,
  user: envVars.MYSQL_USERNAME,
  password: envVars.MYSQL_PASSWORD,
  dbport: envVars.MYSQL_PORT,
  host: envVars.MYSQL_HOST,
  jwtSecret: envVars.JWT_SECRET,
  googleClientId: envVars.GOOGLE_CLIENT_ID,
  googleClientSecret: envVars.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: envVars.GOOGLE_CALLBACK_URL,
  redisHost: envVars.REDIS_HOST,
  redisPort: envVars.REDIS_PORT,
  mailEncryption: envVars.MAIL_ENCRYPTION,
  mailFromAddress: envVars.MAIL_FROM_ADDRESS,
  mailHost: envVars.MAIL_HOST,
  mailer: envVars.MAIL_MAILER,
  mailPassword: envVars.MAIL_PASSWORD,
  mailPort: envVars.MAIL_PORT,
  mailUsername: envVars.MAIL_USERNAME,
  bcryptSaltRound: envVars.BCRYPT_SALT_ROUND,
  port: envVars.PORT,
  defaultPort: envVars.DEFAULT_PORT,
  otpSize: envVars.OTP_SIZE,
  otpTimeout: envVars.OTP_TIMEOUT,
  otpTimeLimit: envVars.OTP_TIME_LIMIT,
  otpLimit: envVars.OTP_LIMIT,
};
