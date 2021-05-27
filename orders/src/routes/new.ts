import { requireAuth, validateRequest, NotFoundError, OrderStatus, BadRequestError } from '@gerrysaporito/ticketing-common';
import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import mongoose from 'mongoose';
import { OrderCreatedPublisher } from '../events/publishers/order-created-publisher';
import { Order } from '../models/order';
import { Ticket } from '../models/ticket';
import { natsWrapper } from '../nats-wrapper';

const EXPIRATION_WINDOW_SECONDS = 1 * 60;

const router = express.Router();

router.post('/api/orders', [
  requireAuth,
  body('ticketId')
    .not()
    .isEmpty()
    .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
    .withMessage('ticketId must be provided'),
  validateRequest
] , async (req: Request, res: Response) => {
  const { ticketId } = req.body;

  const ticket = await Ticket.findById(ticketId);
  if(!ticket) {
    throw new NotFoundError();
  }

  const isReserved = await ticket.isReserved();
  if(isReserved) {
    throw new BadRequestError('Ticket is already reserved')
  }
  
  const expiration = new Date();
  expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

  const order = Order.build({
    userId: req.currentUser!.id,
    status: OrderStatus.Created,
    expiresAt: expiration,
    ticket: ticket
  });
  await order.save();

  await new OrderCreatedPublisher(natsWrapper.client)
    .publish({
      id: order.id,
      status: order.status,
      userId: order.userId,
      expiresAt: order.expiresAt.toISOString(),
      version: order.version,
      ticket: {
        id: order.ticket.id,
        price: order.ticket.price,
      },
    });

  res
    .status(201)
    .send(order);
});

export { router as createOrderRouter };
