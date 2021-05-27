import request from 'supertest';
import { app } from '../../app';
import { signIn } from '../../test/authHelper';

it('responds with details about the current user', async () => {
  const email = 'test@test.com'
  
  const cookie = await signIn();
  
  const response = await request(app)
  .get('/api/users/currentuser')
  .set('Cookie', cookie)
  .send()
  .expect(200);

  expect(response.body.currentUser.email)
    .toEqual(email);
});

it('responds with null if not authenticated', async () => {
  const response = await request(app)
  .get('/api/users/currentuser')
  .send()
  .expect(200);

  expect(response.body.currentUser)
    .toEqual(null);
});