import { Publisher, Subjects, TicketCreatedEvent } from '@gerrysaporito/ticketing-common';

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject: Subjects.TicketCreated = Subjects.TicketCreated;
}