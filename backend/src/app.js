import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import config from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import contractRoutes from './routes/contract.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: config.frontendOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);

app.use(errorHandler);

export default app;
