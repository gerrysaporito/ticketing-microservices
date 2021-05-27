import request from 'supertest';
import { app } from '../../app';
import { signIn } from '../../test/authHelper';

const createTicket = async () => {
  const title = 'Test';
  const price = 20;

  await request(app)
    .post(`/api/tickets`)
    .set('Cookie', signIn())
    .send({
      title, price
    })
    .expect(201);
}

it('can fetch a list of tickets', async () => {
  for (let i = 0; i < 3; ++i) {
    await createTicket();
  }

  const response = await request(app)
    .get(`/api/tickets`)
    .send()
    .expect(200);
  
    expect(response.body.length).toEqual(3);
});
