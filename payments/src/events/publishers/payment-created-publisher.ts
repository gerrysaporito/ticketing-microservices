import { Publisher, Subjects, PaymentCreatedEvent } from '@gerrysaporito/ticketing-common';

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  readonly subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
}
