import { RequestHandler, Router } from 'express';
import jwt from 'jsonwebtoken';
import bcyrpt from 'bcrypt';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const SECRET: string = process.env.SECRET as string;
const port = process.env.PORT;

/* creator register */
router.post('/register', async (req, res) => {
    const { username, password} = req.body;
    const infoNeeded = username && password;

    if (!infoNeeded) {
        return res.status(401).send('missing fields');
    };

    const creator = await prisma.creator.findFirst({
        where: {
            username
        }
    });

    if (creator) {
        return res.status(401).send('creator already exists');
    };

    const newCreator = await prisma.creator.create({
        data: {
            username,
            password: bcyrpt.hashSync(password, 10),
        }
    });

    const token = jwt.sign(newCreator, SECRET, {
        expiresIn: '10h'
    });

    res.status(200).send({ token });
});

/* creator login */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const infoNeeded = username && password;

    if (!infoNeeded) {
        return res.status(401).send('missing fields');
    };

    const creator = await prisma.creator.findFirst({
        where: {
            username
        },
        select: {
            id: true,
            password: true
        }
    });

    if(!creator) {
        return res.status(401).send('please be registered');
    };

    if(!bcyrpt.compareSync(password, creator.password)) {
        return res.status(401).send('please try again');
    };

    const token = jwt.sign({ id: creator.id }, SECRET, {
        expiresIn: '10h'
    });

    res.status(200).send({ token });
});

/* get creator by ID */
router.get('/id', async (req, res) => {
    const { id } = req.body;

    const creatorId = await prisma.creator.findFirst({
        where: {
            id
        },
        select: {
            username: true,
            password: true
        }
    });

    if (!creatorId) {
        return res.status(404).send('creator doesnt exists');
    }

    res.status(200).send({ creatorId });
});


// middleware to verify login
// if the creator of route is logged, the id of creator
//  will be saved in res.locals.userId
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

/* delete creator */
router.delete('/delete', loggedMiddleware, async (req, res) => {
    const { creatorId } = res.locals;

    const deletedCreator = await prisma.creator.deleteMany({
        where: {
            id: creatorId
        },
    });

    if (!deletedCreator.count) {
        return res.status(404).send({ deleted: false });
    };


    res.status(200).send({ deleted: true });
});

export default router;