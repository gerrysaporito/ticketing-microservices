import { OrderCreatedListener } from './events/listeners/order-created-listener';
import { natsWrapper } from './nats-wrapper';

const start = async () => {
  console.log('starting up');
  if(!process.env.NATS_CLIENT_ID) {
    throw new Error('MONGO_URI must be defined')
  }
  if(!process.env.NATS_URL) {
    throw new Error('MONGO_URI must be defined')
  }
  if(!process.env.NATS_CLUSTER_ID) {
    throw new Error('MONGO_URI must be defined')
  }
  
  try{
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL,
    );

    natsWrapper.client.on('close', () => {
      console.log('NATS connection closed.');
      process.exit();
    });

    new OrderCreatedListener(natsWrapper.client).listen();

    process.on('SIGINT', () => natsWrapper.client.close());
    process.on('SIGTERM', () => natsWrapper.client.close());
  } catch(e) {
    console.log(e);
  }
}

start();
