import request from 'supertest';
import { app } from '../app';

// declare global {
//   namespace NodeJS {
//     interface Global {
//       signIn(): Promise<string[]>
//     }
//   }
// }

// global.signIn

const signIn = async (emailParam?: string): Promise<string[]> => {
  const email = emailParam || 'test@test.com';
  const password = 'password';

  const authResponse = await request(app)
  .post('/api/users/signup')
  .send({
    email,
    password,
  })
  .expect(201);

  const cookie = authResponse.get('Set-Cookie');
  
  return cookie
};

export { signIn };
