import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';
import { natsWrapper } from '../../nats-wrapper';
import { signIn } from '../../test/authHelper';

it('has a route handler listening to /api/tickets for post requests', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .send({});

  expect(response.status).not.toEqual(404);
});

it('can only be accessed if the user is signed in', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .send({})
    .expect(401);
});


it('returns a status other than 401 if a use is signed in', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', signIn())
    .send({});

    expect(response.status).not.toEqual(401);
});

it('returns an error if an invalid title is provided', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', signIn())
    .send({
      title: '',
      price: 10
    })
    .expect(400);
  
    await request(app)
    .post('/api/tickets')
    .set('Cookie', signIn())
    .send({
      price: 10
    })
    .expect(400);
});

it('returns an error if an invalid price is provided', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', signIn())
    .send({
      title: 'Test',
      price: -1
    })
    .expect(400);

  await request(app)
    .post('/api/tickets')
    .set('Cookie', signIn())
    .send({
      title: 'Test',
    })
    .expect(400);
});

it('creates a ticket with valid inputs', async () => {
  const title = 'Test';
  let tickets = await Ticket.find({});
  expect(tickets.length).toEqual(0);

  let price = 10;
  await request(app)
    .post('/api/tickets')
    .set('Cookie', signIn())
    .send({
      title, price
    })
    .expect(201);

  tickets = await Ticket.find({});
  expect(tickets.length).toEqual(1);
  expect(tickets[0].title).toEqual(title);
  expect(tickets[0].price).toEqual(price);
  

  price = 0;
  await request(app)
    .post('/api/tickets')
    .set('Cookie', signIn())
    .send({
      title, price
    })
    .expect(201);
  
  tickets = await Ticket.find({});
  expect(tickets.length).toEqual(2);
  expect(tickets[1].title).toEqual(title);
  expect(tickets[1].price).toEqual(price);
});

it('publishes an event', async() => {
  const title = 'Test';
  let tickets = await Ticket.find({});
  expect(tickets.length).toEqual(0);

  let price = 10;
  await request(app)
    .post('/api/tickets')
    .set('Cookie', signIn())
    .send({
      title, price
    })
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
