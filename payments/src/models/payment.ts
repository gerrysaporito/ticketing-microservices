import mongoose from 'mongoose';
import { OrderStatus } from '@gerrysaporito/ticketing-common'

export { OrderStatus };

// An interface that describes the properties that are required to make a new order.
interface PaymentAttrs {
  orderId: string;
  stripeId: string;
}

// An interface that describes the properties that a order document has.
interface PaymentDoc extends mongoose.Document {
  orderId: string;
  stripeId: string;
}

// An interface that describes the properties that a order model has.
interface PaymentModel extends mongoose.Model<PaymentDoc> {
  build(attrs: PaymentAttrs): PaymentDoc;
}

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true
  },
  stripeId: {
    type: String,
    required: true,
  },
},{
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id
      delete ret._id;
    }
  }
});

paymentSchema.statics.build = (attrs: PaymentAttrs) => {
  return new Payment(attrs);
}

const Payment = mongoose.model<PaymentDoc, PaymentModel>('Payment', paymentSchema);

export { Payment };
