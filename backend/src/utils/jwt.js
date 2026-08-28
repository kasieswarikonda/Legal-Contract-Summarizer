import jwt from 'jsonwebtoken';
import config from '../config/env.js';

export function sign(payload){
  return jwt.sign(payload, config.jwtSecret, {expiresIn: config.jwtExpiresIn});
}

export function verify(token){
  return jwt.verify(token, config.jwtSecret);
}
