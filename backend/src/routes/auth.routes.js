import express from 'express';
import {register, login, logout, me} from '../controllers/auth.controller.js';
import {requireAuth} from '../middleware/auth.middleware.js';
import {authRateLimit} from '../middleware/rateLimit.middleware.js';

const router = express.Router();
router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
export default router;
