import mongoose from 'mongoose';
import { Order, OrderStatus } from './order';

// An interface that describes the properties that are required to make a new ticket.
interface TicketAttrs {
  id: string;
  title: string;
  price: number;
}

// An interface that describes the properties that a ticket document has.
export interface TicketDoc extends mongoose.Document {
  title: string;
  price: number;
  version: number;
  isReserved(): Promise<boolean>;
}

// An interface that describes the properties that a ticket model has.
interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc;
  findByEvent(event: { id: string, version: number }): Promise<TicketDoc | null>;
}

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
},{
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id
      delete ret._id;
      // delete ret.__v;
    }
  }
});

ticketSchema.set('versionKey', 'version');
ticketSchema.pre('save', function(done) {
  // @ts-ignore
  this.$where = {
    version: this.get('version') - 1
  }

  done();
});

ticketSchema.statics.build = (attrs: TicketAttrs) => {
  return new Ticket({
    title: attrs.title,
    price: attrs.price,
    _id: attrs.id
  });
}

ticketSchema.statics.findByEvent = (event: { id: string, version: number }) => {
  return Ticket.findOne({
    _id: event.id,
    version: event.version - 1,
  })
}

ticketSchema.methods.isReserved = async function() {
  const existingOrder = await Order.findOne({
    ticket: this.id,
    status: {
      $in: [
        OrderStatus.AwaitingPayment,
        OrderStatus.Complete,
        OrderStatus.Created,
      ]
    }
  });
  
  return !!existingOrder;
}

const Ticket = mongoose.model<TicketDoc, TicketModel>('Ticket', ticketSchema);

export { Ticket };
