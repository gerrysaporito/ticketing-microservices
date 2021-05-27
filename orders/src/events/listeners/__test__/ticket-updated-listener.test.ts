import { TicketUpdatedEvent } from '@gerrysaporito/ticketing-common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../../models/ticket';

import { natsWrapper } from "../../../nats-wrapper";
import { TicketUpdatedListener } from '../ticket-updated-listener';

const setup = async () => {
  // Create an instance of the listener
  const listener = new TicketUpdatedListener(natsWrapper.client);

  // Create and save a ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 20,
    id: new mongoose.Types.ObjectId().toHexString(),
  });
  await ticket.save();

  // Create a fake data object
  const data: TicketUpdatedEvent['data'] = {
    version: ticket.version + 1,
    id: ticket.id,
    title: 'new concert',
    price: 10,
    userId: new mongoose.Types.ObjectId().toHexString(),
  };

  // Create a fake msg object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  };

  return { listener, data, msg, ticket };
}

it('creates and saves a ticket', async () => {
  const { listener, data, msg, ticket } = await setup();

  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket).toBeDefined();
  expect(updatedTicket!.title).toEqual(data.title);
  expect(updatedTicket!.price).toEqual(data.price);
  expect(updatedTicket!.version).toEqual(data.version);
});

it('acks the message', async () => {
  const { listener, data, msg, ticket } = await setup();
  
  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});

it('doesn\'t call ack if the event has skipped a version number', async () => {
  const { listener, data, msg, ticket } = await setup();

  data.version = 10;
  
  try {
    await listener.onMessage(data, msg);
  } catch(e) {}

  expect(msg.ack).not.toHaveBeenCalled();
});
