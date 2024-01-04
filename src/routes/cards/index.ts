import { Router, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const router = Router();
const SECRET: string = process.env.SECRET as string;

const loggedMiddleware: RequestHandler = (req, res, next) => {
    const auth = req.headers.authorization || '';

    const parts = auth.split(' ');

    if(parts.length != 2)
        return res.status(401).send();

    const [prefix, token] = parts;

    if(prefix !== 'Bearer')
        return res.status(401).send();

    jwt.verify(token, SECRET, (error, decoded) => {
        if(error) {
            return res.status(401).send(error);
        }

        res.locals.creatorId = (decoded as jwt.JwtPayload).id;

        next();
    });
};

/* route to create a card */
router.post('/create', loggedMiddleware, async (req, res) => {
    const { fields } = req.body;
    const { creatorId,  } = res.locals;
    const infoNeeded =  fields;
    
    if(!infoNeeded) {
        return res.status(404).send('missing fields')
    };

    const newCard = await prisma.card.create({
        data: {
            creatorId,
            fields,
            useCount: 0,            
        },
    });

    res.status(200).send({ newCard });
});

/* route to return all the cards */
router.get('/all_cards', async (req, res) => {
    const { id } = req.body;

    const allCards = await prisma.card.findMany({ });

    if(!allCards) {
        return res.status(404).send('no cards founded');
    }

    res.status(200).send({ allCards });
});

/* delete a card */
router.delete('/delete', loggedMiddleware, async (req, res) => {
    const { id } = req.body;
    const { creatorId } = res.locals;

    const deletedCards = await prisma.card.deleteMany({
        where: {
            creatorId,
            id
        }
    });

    if(!deletedCards.count)
        return res.status(404).send({ deleted: false });

    return res.status(200).send({ deleted: true });
});

export default router;