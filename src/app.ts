import express from 'express';
import morgan from 'morgan';
import 'dotenv/config';
import creatorRouter from './routes/creator';
import cardRouter from './routes/cards';
import userRouter from './routes/user';

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(morgan('dev'));

app.use('/creator', creatorRouter);
app.use('/card', cardRouter);
app.use('/user', userRouter);

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}!`);
});
