import {getUser, loginUser, registerUser, safeUser} from '../services/auth.service.js';
import {validateLogin, validateRegister} from '../validators/auth.validator.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function setAuthCookie(res, token){ res.cookie('token', token, cookieOptions); }

export async function register(req, res){
  const result = validateRegister(req.body);
  if (!result.valid) return res.status(400).json({success: false, errors: result.errors});
  const auth = await registerUser(result.data);
  if (!auth) return res.status(409).json({success: false, message: 'Email is already registered'});
  setAuthCookie(res, auth.token);
  return res.status(201).json({success: true, message: 'Registration successful', user: auth.user});
}

export async function login(req, res){
  const result = validateLogin(req.body);
  if (!result.valid) return res.status(400).json({success: false, message: 'Invalid email or password'});
  const auth = await loginUser(result.data);
  if (!auth) return res.status(401).json({success: false, message: 'Invalid email or password'});
  setAuthCookie(res, auth.token);
  return res.json({success: true, message: 'Login successful', user: auth.user});
}

export function logout(req, res){
  res.clearCookie('token', cookieOptions);
  return res.json({success: true, message: 'Logged out successfully'});
}

export async function me(req, res){
  const user = await getUser(req.user.userId);
  if (!user) return res.status(401).json({success: false, message: 'Unauthorized'});
  return res.json({success: true, user: safeUser(user)});
}
