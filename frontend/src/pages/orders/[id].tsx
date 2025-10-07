import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import OrderDetails from '../../components/OrderDetails';
import withAuth from '@/hocs/withAuth';

const OrderDetailsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  // Convert id to number
  const orderId = typeof id === 'string' ? parseInt(id, 10) : null;

  if (!orderId || isNaN(orderId)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Order ID</h2>
          <button
            onClick={() => router.push('/orders')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Order #{orderId} - Lootamo</title>
        <meta name="description" content={`Order details for order #${orderId}`} />
      </Head>
      <OrderDetails orderId={orderId} />
    </>
  );
};

export default withAuth(OrderDetailsPage);
