import mongoose from 'mongoose';
import { OrderStatus } from '@gerrysaporito/ticketing-common'
import { TicketDoc } from './ticket';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

export { OrderStatus };

// An interface that describes the properties that are required to make a new order.
interface OrderAttrs {
  userId: string;
  status: OrderStatus;
  expiresAt: Date;
  ticket: TicketDoc;
}

// An interface that describes the properties that a order document has.
interface OrderDoc extends mongoose.Document {
  userId: string;
  status: OrderStatus;
  expiresAt: Date;
  ticket: TicketDoc;
  version: number;
}

// An interface that describes the properties that a order model has.
interface OrderModel extends mongoose.Model<OrderDoc> {
  build(attrs: OrderAttrs): OrderDoc;
}

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: OrderStatus.Created
  },
  expiresAt: {
    type: mongoose.Schema.Types.Date,
    required: true
  },
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  }
},{
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id
      delete ret._id;
    }
  }
});

orderSchema.set('versionKey', 'version');

orderSchema.plugin(updateIfCurrentPlugin);

orderSchema.statics.build = (attrs: OrderAttrs) => {
  return new Order(attrs);
}

const Order = mongoose.model<OrderDoc, OrderModel>('Order', orderSchema);

export { Order };
