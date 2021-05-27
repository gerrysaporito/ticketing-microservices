import { Publisher, Subjects, TicketUpdatedEvent } from '@gerrysaporito/ticketing-common';

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
}