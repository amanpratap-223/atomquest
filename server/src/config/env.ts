import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT:          process.env.PORT || 5000,
  MONGO_URI:     process.env.MONGO_URI || 'mongodb://localhost:27017/atomquest',
  JWT_SECRET:    process.env.JWT_SECRET || 'atomquest-dev-secret-change-in-prod',
  JWT_EXPIRES:   process.env.JWT_EXPIRES || '7d',
  NODE_ENV:      process.env.NODE_ENV || 'development',
  CLIENT_URL:    process.env.CLIENT_URL || 'http://localhost:5173',
  EMAIL_HOST:    process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT:    Number(process.env.EMAIL_PORT) || 587,
  EMAIL_USER:    process.env.EMAIL_USER || '',
  EMAIL_PASS:    process.env.EMAIL_PASS || '',
  EMAIL_FROM:    process.env.EMAIL_FROM || 'AtomQuest <noreply@atomberg.com>',
  AZURE_TENANT:  process.env.AZURE_TENANT_ID || '',
  AZURE_CLIENT:  process.env.AZURE_CLIENT_ID || '',
};
