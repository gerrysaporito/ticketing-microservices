import { NotFoundError, requireAuth, validateRequest } from '@gerrysaporito/ticketing-common';
import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { Order } from '../models/order';

const router = express.Router();

router.get('/api/orders', requireAuth, async (req: Request, res: Response) => {
  const orders = await Order.find({
      userId: req.currentUser!.id
    })
    .populate('ticket');

  res
    .status(200)
    .send(orders);
});

export { router as indexOrderRouter };
