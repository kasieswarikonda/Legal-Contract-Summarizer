import app from './app.js';
import config from './config/env.js';
import {connect} from './config/database.js';

async function start(){
  await connect();
  app.listen(config.port, ()=>console.log(`Server running on ${config.port}`));
}

start().catch(err=>{
  console.error(err);
  process.exit(1);
});
