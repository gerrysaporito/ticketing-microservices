import Link from "next/link"

const OrderIndex = ({ orders }) => {
  const ordersList = orders.map(order => {
    return (
      <li key={order.id}>
        {order.ticket.title} - {order.status}
      </li>
    )
  })

  return (
      <div>
        <h1>OrderShow</h1>
        <ul>
          {ordersList}
        </ul>
      </div>
    )
};

// context === { req, res }
OrderIndex.getInitialProps = async (context, client) => {
  const { data } = await client.get('/api/orders');

  return { orders: data };
}

export default OrderIndex;