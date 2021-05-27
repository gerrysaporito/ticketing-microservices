import { useState, useEffect } from "react";
import StripeCheckout from 'react-stripe-checkout';
import useRequest from '../../hooks/use-request';

const OrderShow = ({ order, currentUser }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  const { doRequest, errors } = useRequest({
    url: '/api/payments',
    method: 'post',
    body: {
      orderId: order.id,
    },
    onSuccess: (payment) => Router.push("/orders"),
  })

  useEffect(() => {
    const findTimeLeft = () => {
      const msLeft = new Date(order.expiresAt) - new Date();
      setTimeLeft(Math.round(msLeft/1000));
    };

    findTimeLeft();
    const timerId = setInterval(findTimeLeft, 1000);

    return () => {
      clearInterval(timerId);
    }
  }, [order]);

  if (timeLeft < 0) {
    return (
      <div>
        <h4>Order Expired</h4>
      </div>
    )
  }

  return (
    <div>
      <h4>Time left to pay: {timeLeft}</h4>
      <StripeCheckout 
        token={({ id }) => doRequest({ token: id })} 
        stripeKey="pk_test_51IvVe5AoGiDv0smuSTLWX9o9ohVlyj1f88rKqWIwExUevObC5SXVZJKqlrcZVLlTNyD5IoPVKn3eE24PnetzItj700ledx87T5" 
        amount={order.ticket.price*100}
        email={currentUser.email}
      />
      {errors}
    </div>
  )
}

OrderShow.getInitialProps = async (context, client) => {
  const { orderId } = context.query;
  const { data } = await client.get(`/api/orders/${orderId}`);

  return { order: data }
}

export default OrderShow;
