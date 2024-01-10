import { PrismaClient } from "@prisma/client";
import { RequestHandler, Router } from "express";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const prisma = new PrismaClient();
const router = Router();
const SECRET: string = process.env.SECRET as string;

/* user register */
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const infoNeeded = username && password;

    if(!infoNeeded) {
        return res.status(401).send('missing fields');
    }

    const user = await prisma.user.findFirst({
        where: {
            username
        }
    });

    if(user) {
        return res.status(401).send('user already exists');
    }
    
    const newUser = await prisma.user.create({
        data: {
            username,
            password: bcrypt.hashSync(password, 10)
        }
    });

    const token = jwt.sign(newUser, SECRET, {
        expiresIn: '5h'
    });

    res.status(200).send({ newUser, token });
});

/* user login */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const infoNeeded = username && password;

    if(!infoNeeded) {
        return res.status(401).send('missing fields');
    }

    const user = await prisma.user.findFirst({
        where: {
            username
        },
        select: {
            id: true,
            password: true
        }
    });

    if(!user) {
        return res.status(404).send('user not founded')
    }

    if(!bcrypt.compareSync(password, user.password)) {
        return res.status(401).send('the passwords are not the same');
    }

    return res.status(200).send('you are logged :D')
});

/* all cards from a logged in user */
router.get('/user_cards', async (req, res) => {
    const { username, password } = req.body;
    const infoNeeded = username && password;

    if(!infoNeeded) {
        return res.status(401).send('missing fields');
    }

    const usedCards = await prisma.card.findMany({ });

    return res.status(200).send({ usedCards });
});

export default router;
