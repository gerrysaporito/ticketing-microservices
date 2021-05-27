import { Publisher, Subjects, OrderCancelledEvent } from '@gerrysaporito/ticketing-common';

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  readonly subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
}
