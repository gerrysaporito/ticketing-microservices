import request from 'supertest';
import { app } from '../app';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// declare global {
//   namespace NodeJS {
//     interface Global {
//       signIn(): Promise<string[]>
//     }
//   }
// }

// global.signIn

const signIn = (): string[] => {
  const email = 'test@test.com';
  const id = new mongoose.Types.ObjectId().toHexString();
  const payload = {
    email, id
  };

  const token = jwt.sign(payload, process.env.JWT_KEY!);
  const session = { jwt: token };
  const sessionJSON = JSON.stringify(session);

  const base64 = Buffer.from(sessionJSON).toString('base64');
  
  return [`express:sess=${base64}`];
};

export { signIn };
