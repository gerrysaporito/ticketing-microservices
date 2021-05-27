import request from 'supertest';
import { app } from '../../app';
import { signIn } from '../../test/authHelper';
import mongoose from 'mongoose';
import { Ticket } from '../../models/ticket';

const buildTicket = async () => {
  const ticket = Ticket.build({
    title: 'concert',
    price: 20,
    id: mongoose.Types.ObjectId().toHexString(),
  });
  await ticket.save();

  return ticket;
}

it('returns a 404 if the order is not found', async () => {
  let id = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    .get(`/api/orders/${id}`)
    .set('Cookie', signIn())
    .send()
    .expect(404);
});

it('returns an error if one user tries to fetch another user\'s order', async () => {
  const ticket = await buildTicket();

  const { body: order } = await request(app)
    .post(`/api/orders`)
    .set('Cookie', signIn())
    .send({
      ticketId: ticket.id
    })
    .expect(201);

  await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', signIn())
    .send()
    .expect(401);
});

it('returns the order if the order is found', async () => {
  const cookie = signIn();
  const ticket = await buildTicket();

  const { body: order } = await request(app)
    .post(`/api/orders`)
    .set('Cookie', cookie)
    .send({
      ticketId: ticket.id
    })
    .expect(201);

  const { body: fetchedOrder } = await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', cookie)
    .send()
    .expect(200);
  
    expect(fetchedOrder.id).toEqual(order.id);
});
