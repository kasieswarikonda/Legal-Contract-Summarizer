import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/legal_contract_summarizer',
  jwtSecret: process.env.JWT_SECRET || 'change_me',
};
