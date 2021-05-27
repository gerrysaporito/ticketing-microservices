import { Publisher, Subjects, OrderCreatedEvent } from '@gerrysaporito/ticketing-common';

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  readonly subject: Subjects.OrderCreated = Subjects.OrderCreated;
}
