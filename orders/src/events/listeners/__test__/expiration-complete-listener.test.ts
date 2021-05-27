import { ExpirationCompleteEvent, OrderStatus } from '@gerrysaporito/ticketing-common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { Order } from '../../../models/order';
import { Ticket } from '../../../models/ticket';

import { natsWrapper } from "../../../nats-wrapper";
import { ExpirationCompleteListener } from "../expiration-complete-listener";

const setup = async () => {
  // Create an instance of the listener
  const listener = new ExpirationCompleteListener(natsWrapper.client);

  // Create and save a ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 20,
    id: new mongoose.Types.ObjectId().toHexString(),
  });
  await ticket.save();
  
  // Create and save an order
  const order = Order.build({
    status: OrderStatus.Created,
    userId: new mongoose.Types.ObjectId().toHexString(),
    expiresAt: new Date(),
    ticket
  });
  await order.save();
  
  // Create a fake data event 
  const data: ExpirationCompleteEvent['data'] = {
    orderId: order.id
  };

  // Create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  };

  return { listener, ticket, order, data, msg };
}

it('updates the order status to cancelled', async () => {
  const { listener, ticket, order, data, msg } = await setup();

  await listener.onMessage(data, msg);

  const updatedOrder = await Order.findById(order.id);

  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('emit an OrderCancelled event', async () => {
  const { listener, ticket, order, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(natsWrapper.client.publish).toHaveBeenCalled();

  const eventData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);

  expect(eventData!.id).toEqual(order.id);
});

it('acks the message', async () => {
  const { listener, ticket, order, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});
