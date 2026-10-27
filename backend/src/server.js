import app from './app.js';
import config from './config/env.js';
import {connect} from './config/database.js';

async function start(){
  if (!config.jwtSecret) throw new Error('JWT_SECRET is required');
  if (!config.geminiApiKey) throw new Error('GEMINI_API_KEY is required');
  await connect();
  app.listen(config.port, ()=>console.log(`Server running on ${config.port}`));
}

start().catch(err=>{
  console.error(err);
  process.exit(1);
});
