import mongoose from 'mongoose';
import { OrderStatus } from '@gerrysaporito/ticketing-common'
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

export { OrderStatus };

// An interface that describes the properties that are required to make a new order.
interface OrderAttrs {
  id: string;
  version: number;
  userId: string;
  status: OrderStatus;
  price: number;
}

// An interface that describes the properties that a order document has.
interface OrderDoc extends mongoose.Document {
  version: number;
  userId: string;
  status: OrderStatus;
  price: number;
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
  price: {
    type: Number,
    required: true
  },
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
  return new Order({
    _id: attrs.id,
    version: attrs.version,
    price: attrs.price,
    userId: attrs.userId,
    status: attrs.status,
  });
}

const Order = mongoose.model<OrderDoc, OrderModel>('Order', orderSchema);

export { Order };
