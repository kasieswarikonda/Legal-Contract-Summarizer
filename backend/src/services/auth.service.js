import {User} from '../models/user.model.js';
import {hashPassword, comparePassword} from '../utils/password.js';
import {sign} from '../utils/jwt.js';

export function safeUser(user){
  return {id: user._id.toString(), name: user.name, email: user.email, role: user.role};
}

export async function registerUser({name, email, password}){
  const existing = await User.findOne({email});
  if (existing) return null;
  const user = await User.create({name, email, password: await hashPassword(password)});
  return {user: safeUser(user), token: sign({userId: user._id.toString(), role: user.role})};
}

export async function loginUser({email, password}){
  const user = await User.findOne({email}).select('+password');
  if (!user || !(await comparePassword(password, user.password))) return null;
  return {user: safeUser(user), token: sign({userId: user._id.toString(), role: user.role})};
}

export async function getUser(userId){
  return User.findById(userId);
}
