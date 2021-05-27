import request from 'supertest';
import { app } from '../../app';
import { signIn } from '../../test/authHelper';
import mongoose from 'mongoose';
import { Ticket } from '../../models/ticket';
import { Order, OrderStatus } from '../../models/order';
import { natsWrapper } from '../../nats-wrapper';

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

it('returns an error if one user tries to cancel another user\'s order', async () => {
  const ticket = await buildTicket();

  const { body: order } = await request(app)
    .post(`/api/orders`)
    .set('Cookie', signIn())
    .send({
      ticketId: ticket.id
    })
    .expect(201);

  await request(app)
    .delete(`/api/orders/${order.id}`)
    .set('Cookie', signIn())
    .send()
    .expect(401);
});

it('marks an order as cancelled', async () => {
  const cookie = signIn();
  const ticket = await buildTicket();

  const { body: order } = await request(app)
    .post(`/api/orders`)
    .set('Cookie', cookie)
    .send({
      ticketId: ticket.id
    })
    .expect(201);

  await request(app)
    .delete(`/api/orders/${order.id}`)
    .set('Cookie', cookie)
    .send()
    .expect(204);

  const updatedOrder = await Order.findById(order.id);
  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled)
});

it('emits an order cancelled event', async() => {
  const cookie = signIn();
  const ticket = await buildTicket();

  const { body: order } = await request(app)
    .post(`/api/orders`)
    .set('Cookie', cookie)
    .send({
      ticketId: ticket.id
    })
    .expect(201);

  await request(app)
    .delete(`/api/orders/${order.id}`)
    .set('Cookie', cookie)
    .send()
    .expect(204);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
