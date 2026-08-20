import {verify} from '../utils/jwt.js';

export function requireAuth(req,res,next){
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({success: false, message: 'Unauthorized'});
  try {
    req.user = verify(token);
    next();
  } catch {
    return res.status(401).json({success: false, message: 'Unauthorized'});
  }
}
