import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';
import { natsWrapper } from '../../nats-wrapper';
import { signIn } from '../../test/authHelper';

it('returns a 404 if provided id does not exist', async () => {
  let id = new mongoose.Types.ObjectId().toHexString();
  
   await request(app)
    .put(`/api/tickets/${id}`)
    .set('Cookie', signIn())
    .send({
      title: 'Test',
      price: 20
    })
    .expect(404);
  });

it('returns a 401 if the user is not authenticated', async () => {
  let id = new mongoose.Types.ObjectId().toHexString();
  
   await request(app)
    .put(`/api/tickets/${id}`)
    .send({
      title: 'Test',
      price: 20
    })
    .expect(401);
});


it('returns a 401 if the user doåes not own the ticket', async () => {
  const title = 'Test'
  const price = 10
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', signIn())
    .send({
      title: title,
      price: price
    })
    .expect(201);

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', signIn())
    .send({
      title: `New-${title}`,
      price: price + 10
    })
    .expect(401);

  const ticket = await Ticket.findById(response.body.id);
  expect(ticket?.title).toEqual(title);
  expect(ticket?.price).toEqual(price);

});

it('returns a 400 if the user provides an invalid title or price', async () => {
  const title = 'Test'
  const price = 10
  const cookie = signIn();

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: title,
      price: price
    })
    .expect(201);

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: '',
      price: price + 10
    })
    .expect(400);

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      price: price + 10
    })
    .expect(400);

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'Test',
      price: -1
    })
    .expect(400);

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: 'Test',
    })
    .expect(400);

  const ticket = await Ticket.findById(response.body.id);
  expect(ticket?.title).toEqual(title);
  expect(ticket?.price).toEqual(price);
});

it('rejects update if ticket is reserved', async () => {
  const title = 'Test';
  const price = 10;
  const cookie = signIn();

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: `Old-${title}`,
      price: price + 10
    })
    .expect(201);
  
  const ticket = await Ticket.findById(response.body.id);
  ticket!.set({ orderId: mongoose.Types.ObjectId().toHexString() });
  await ticket!.save();

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: title,
      price: price,
    })
    .expect(400);
});

it('updates the ticket provided valid inputs', async () => {
  const title = 'Test';
  const price = 10;
  const cookie = signIn();

  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: `Old-${title}`,
      price: price + 10
    })
    .expect(201);

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: title,
      price: price
    })
    .expect(200);

  const ticket = await Ticket.findById(response.body.id);
  expect(ticket?.title).toEqual(title);
  expect(ticket?.price).toEqual(price);
});

it('publishes an event', async() => {
  const title = 'Test';
  let tickets = await Ticket.find({});
  const cookie = signIn();

  expect(tickets.length).toEqual(0);

  let price = 10;
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title, price
    })
    .expect(201);

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set('Cookie', cookie)
    .send({
      title: title,
      price: price
    })
    .expect(200);


  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
