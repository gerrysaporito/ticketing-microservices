import { ExpirationCompleteEvent, Listener, OrderStatus, Subjects } from "@gerrysaporito/ticketing-common";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/order";
import { OrderCancelledPublisher } from "../publishers/order-cancelled-publisher";
import { queueGroupName } from "./queue-group-name";


export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
  queueGroupName = queueGroupName;

  async onMessage(data: ExpirationCompleteEvent['data'], msg: Message) {
    const order = await Order.findById(data.orderId).populate('ticket');

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== OrderStatus.Complete) {
      order.set({
        status: OrderStatus.Cancelled,
      });
      await order.save();
    }

    await new OrderCancelledPublisher(this.client).publish({
      id: order.id,
      version: order.id,
      ticket: {
        id: order.ticket.id
      },
    });

    msg.ack();
  }
}
