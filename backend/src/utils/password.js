import bcrypt from 'bcrypt';

export async function hashPassword(pw){
  return bcrypt.hash(pw, 10);
}

export async function comparePassword(pw, hash){
  return bcrypt.compare(pw, hash);
}
