import Stripe from 'stripe';
import dotenv from 'dotenv';

if (process.env.NODE_ENV === 'test') {
  dotenv.config();
}

export const stripe = new Stripe(process.env.STRIPE_KEY!, {
  apiVersion: '2020-08-27'
});
