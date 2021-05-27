import request from 'supertest';
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import { natsWrapper } from '../../nats-wrapper';
import { signIn } from '../../test/authHelper';
import mongoose from 'mongoose';
import { stripe } from '../../stripe';
import { Payment } from '../../models/payment';

/*
 * To use the mock stripe, remove the .old extension on the stripe.ts file in the __mocks__ folder.
 */
// jest.mock('../../stripe');

it('has a route handler listening to /api/payments for post requests', async () => {
  const response = await request(app)
    .post('/api/payments')
    .send({});

  expect(response.status).not.toEqual(404);
});

it('can only be accessed if the user is signed in', async () => {
  const response = await request(app)
    .post('/api/payments')
    .send({})
    .expect(401);
});


it('returns a status other than 401 if a user is signed in', async () => {
  const response = await request(app)
    .post('/api/payments')
    .set('Cookie', signIn())
    .send({});

    expect(response.status).not.toEqual(401);
});

it('returns a 404 when purchasing an order that does not exist', async () => {
  await request(app)
    .post('/api/payments')
    .set('Cookie', signIn())
    .send({
      token: 'asdf',
      orderId: new mongoose.Types.ObjectId().toHexString(),
    })
    .expect(404);
});

it('returns a 401 if purchasing an order that doesn\'t belong to the user', async () => {
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price: 20,
    status: OrderStatus.Created
  });
  await order.save();
  
  await request(app)
    .post('/api/payments')
    .set('Cookie', signIn())
    .send({
      token: 'asdf',
      orderId: order.id,
    })
    .expect(401);
});

it('returns 400 when purchasing a cancelled order', async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();
  
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId,
    version: 0,
    price: 20,
    status: OrderStatus.Cancelled,
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', signIn(userId))
    .send({
      token: 'asdf',
      orderId: order.id,
    })
    .expect(400);
});

it('returns a 201 with valid inputs using Stripe api', async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();
  const price = Math.floor(Math.random() * 10**6);

  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    status: OrderStatus.Created,
    userId,
    price,
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', signIn(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id,
    })
    .expect(201);

  const stripeCharges = await stripe.charges.list({ limit: 100 });
  const stripeCharge = stripeCharges.data.find((charge) => {
    return charge.amount === price * 100;
  });

  expect(stripeCharge).toBeDefined();
  expect(stripeCharge!.amount).toEqual(order.price*100);
  expect(stripeCharge!.currency).toEqual('usd');

  const payment = await Payment.findOne({
    orderId: order.id,
    stripeId: stripeCharge!.id,
  });

  expect(payment).not.toBeNull();
});

// it('returns a 201 with valid inputs using Mock stripe object', async () => {
//   const userId = new mongoose.Types.ObjectId().toHexString();
//   const price = Math.floor(Math.random() * 10**6)

//   const order = Order.build({
//     id: new mongoose.Types.ObjectId().toHexString(),
//     version: 0,
//     status: OrderStatus.Created,
//     userId,
//     price,
//   });
//   await order.save();

//   await request(app)
//     .post('/api/payments')
//     .set('Cookie', signIn(userId))
//     .send({
//       token: 'tok_visa',
//       orderId: order.id,
//     })
//     .expect(201);

//   const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];
//   expect(chargeOptions.source).toEqual('tok_visa');
//   expect(chargeOptions.amount).toEqual(order.price*100);
//   expect(chargeOptions.currency).toEqual('usd');
// });
