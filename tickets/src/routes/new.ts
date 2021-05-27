import { requireAuth, validateRequest } from '@gerrysaporito/ticketing-common';
import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { TicketCreatedPublisher } from '../events/publishers/ticket-created-publisher';
import { Ticket } from '../models/ticket';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.post('/api/tickets', [
  requireAuth,
  body('title')
    .not()
    .isEmpty()
    .withMessage('Must include title'),
  body('price')
    .not()
    .isEmpty()
    .isFloat({ gt: -0.01 })
    .withMessage('Price must be greater than 0'),
  validateRequest
] , async (req: Request, res: Response) => {
  const { title, price } = req.body;

  const ticket = Ticket.build({
    title,
    price,
    userId: req.currentUser!.id
  })

  await ticket.save();

  await new TicketCreatedPublisher(natsWrapper.client)
    .publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      version: ticket.version,
    });

  res
    .status(201)
    .send(ticket);
});

export { router as createTicketRouter };
