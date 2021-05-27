import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';
import { signIn } from '../../test/authHelper';

const buildTicket = async () => {
  const ticket = Ticket.build({
    title: 'concert',
    price: 20,
    id: mongoose.Types.ObjectId().toHexString(),
  });
  await ticket.save();

  return ticket;
}

const createOrder = async (cookie: string[]) => {
  const ticket = await buildTicket();

  await request(app)
    .post('/api/orders')
    .set('Cookie', cookie)
    .send({
      ticketId: ticket.id
    })
    .expect(201);
}

it('can fetch a list of orders', async () => {
  const user1 = signIn();
  const orders1 = 2;
  const user2 = signIn();
  const orders2 = 3;

  for (let i = 0; i < orders1; ++i) {
    await createOrder(user1);
  }

  for (let i = 0; i < orders2; ++i) {
    await createOrder(user2);
  }

  const response = await request(app)
    .get(`/api/orders`)
    .set('Cookie', user2)
    .send()
    .expect(200);
  
    expect(response.body.length).toEqual(orders2);
});
