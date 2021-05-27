import request from 'supertest';
import { app } from '../../app';
import { signIn } from '../../test/authHelper';
import mongoose from 'mongoose';

it('returns a 404 if the ticket is not found', async () => {
  let id = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    .get(`/api/tickets/${id}`)
    .send()
    .expect(404);
});

it('returns the ticket if the ticket is found', async () => {
  const title = 'Test';
  const price = 20;

  const response = await request(app)
    .post(`/api/tickets`)
    .set('Cookie', signIn())
    .send({
      title, price
    })
    .expect(201);

  let ticketResponse = await request(app)
    .get(`/api/tickets/${response.body.id}`)
    .send()
    .expect(200);
  
    expect(ticketResponse.body.title).toEqual(title);
    expect(ticketResponse.body.price).toEqual(price);
});
