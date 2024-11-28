import dotenv from 'dotenv';
dotenv.config({
  path: './.env',
});
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookies', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
    credentials: true,
  }),
);

app.get('/', (req, res) => {
  return res.send('Welcome to taskmanagement service');
});

app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));
app.use(cookieParser());


import userRouter from './routes/User.route.js';

app.use('/api/user', userRouter);

export { app };
