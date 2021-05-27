import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

jest.mock('../nats-wrapper');

let mongo: MongoMemoryServer;

beforeAll(async () => {

  process.env.JWT_KEY = 'asdf';

  mongo = new MongoMemoryServer();
  const mongoUri = await mongo.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
});

beforeEach(async () => {
  jest.clearAllMocks();
  
  const collections = await mongoose.connection.db.collections();

  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});
