import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import {errorHandler} from './middleware/error.middleware.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.use(errorHandler);

export default app;
