import mongoose from 'mongoose';
import config from './env.js';

export async function connect(){
  await mongoose.connect(config.mongoUri);
}
