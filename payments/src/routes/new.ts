import { requireAuth, validateRequest, NotFoundError, OrderStatus, BadRequestError, NotAuthorizedError } from '@gerrysaporito/ticketing-common';
import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { PaymentCreatedPublisher } from '../events/publishers/payment-created-publisher';
import { Order } from '../models/order';
import { Payment } from '../models/payment';
import { natsWrapper } from '../nats-wrapper';
import { stripe } from '../stripe';

const router = express.Router();

router.post('/api/payments', [
  requireAuth,
  body('token')
    .not()
    .isEmpty()
    .withMessage('token must be provided'),
  body('orderId')
    .not()
    .isEmpty()
    .withMessage('token must be provided'),
  validateRequest
] , async (req: Request, res: Response) => {
  const { token, orderId } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new NotFoundError();
  }
  if (order.userId !== req.currentUser!.id) {
    throw new NotAuthorizedError();
  }
  if (order.status === OrderStatus.Cancelled) {
    throw new BadRequestError('Cannot pay for a cancelled order');
  }

  const charge = await stripe.charges.create({
    currency: 'usd',
    amount: order.price * 100,
    source: token,
    description: 'Your ticket',
  });

  const payment = Payment.build({
    orderId: order.id,
    stripeId: charge.id,
  });
  await payment.save();

  await new PaymentCreatedPublisher(natsWrapper.client).publish({
    id: payment.id,
    orderId: order.id,
    stripeId: charge.id
  });

  res
    .status(201)
    .send({ payment });
});

export { router as createChargeRouter };
