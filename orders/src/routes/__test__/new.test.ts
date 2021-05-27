import request from 'supertest';
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import { natsWrapper } from '../../nats-wrapper';
import { signIn } from '../../test/authHelper';
import mongoose from 'mongoose';
import { Ticket } from '../../models/ticket';

it('has a route handler listening to /api/orders for post requests', async () => {
  const response = await request(app)
    .post('/api/orders')
    .send({});

  expect(response.status).not.toEqual(404);
});

it('can only be accessed if the user is signed in', async () => {
  const response = await request(app)
    .post('/api/orders')
    .send({})
    .expect(401);
});


it('returns a status other than 401 if a user is signed in', async () => {
  const response = await request(app)
    .post('/api/orders')
    .set('Cookie', signIn())
    .send({});

    expect(response.status).not.toEqual(401);
});

it('returns an error if an invalid ticketId is provided', async () => {
  await request(app)
    .post('/api/orders')
    .set('Cookie', signIn())
    .send({
      ticketId: '',
    })
    .expect(400);
  
    await request(app)
    .post('/api/orders')
    .set('Cookie', signIn())
    .send({})
    .expect(400);
});

it('returns an error if an invalid price is provided', async () => {
  await request(app)
    .post('/api/orders')
    .set('Cookie', signIn())
    .send({
      title: 'Test',
      price: -1
    })
    .expect(400);

  await request(app)
    .post('/api/orders')
    .set('Cookie', signIn())
    .send({
      title: 'Test',
    })
    .expect(400);
});

it('returns an error if the ticket does not exist', async () => {
  const ticketId = mongoose.Types.ObjectId();

  await request(app)
    .post('/api/orders')
    .set('Cookie', signIn())
    .send({
      ticketId
    })
    .expect(404);
});

it('returns an error if the ticket is already reserved', async() => {
  const ticket = Ticket.build({
    title: 'concert',
    price: 20,
    id: mongoose.Types.ObjectId().toHexString(),
  });
  await ticket.save();
  
  const order = Order.build({
    ticket,
    userId: 'adfas',
    status: OrderStatus.Created,
    expiresAt: new Date(),
  });
  await order.save();
  
  await request(app)
    .post('/api/orders')
    .set('Cookie', signIn())
    .send({
      ticketId: ticket.id
    })
    .expect(400);
});

it('reserves a ticket', async () => {
  const ticket = Ticket.build({
    title: 'concert',
    price: 20,
    id: mongoose.Types.ObjectId().toHexString(),
  });
  await ticket.save();
    
  await request(app)
    .post('/api/orders')
    .set('Cookie', signIn())
    .send({
      ticketId: ticket.id
    })
    .expect(201);
});

it('emits an order created event', async() => {
  const cookie = signIn();

  const ticket = Ticket.build({
    title: 'concert',
    price: 20,
    id: mongoose.Types.ObjectId().toHexString(),
  });
  await ticket.save();

  await request(app)
    .post('/api/orders')
    .set('Cookie', cookie)
    .send({
      ticketId: ticket.id
    })
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
