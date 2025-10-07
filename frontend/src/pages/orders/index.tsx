import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { orderService, Order } from '../../services/orderService';
import withAuth from '@/hocs/withAuth';

const OrdersPage: React.FC = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Note: You'll need to implement this endpoint in your backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'expired':
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Orders - Lootamo</title>
        <meta name="description" content="View your order history and download license keys" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="mt-2 text-gray-600">View your order history and download license keys</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  <button
                    onClick={fetchOrders}
                    className="mt-2 text-sm font-medium text-red-800 hover:text-red-700"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6">
                When you make your first purchase, it will appear here.
              </p>
              <Link
                href="/products"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${orderService.getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-2">{orderService.formatOrderStatus(order.status)}</span>
                        </span>
                        <Link
                          href={`/orders/${order.id}`}
                          className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total Amount:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          €{order.total_price.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Payment Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${orderService.getStatusColor(order.payment_status)}`}>
                          {orderService.formatOrderStatus(order.payment_status)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Items:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {order.order_items?.length || 1}
                        </span>
                      </div>
                    </div>

                    {order.order_items && order.order_items.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Items:</h4>
                        <div className="space-y-1">
                          {order.order_items.slice(0, 3).map((item, index) => (
                            <div key={item.id} className="text-sm text-gray-600">
                              Product {item.product_id} - €{item.price.toFixed(2)}
                            </div>
                          ))}
                          {order.order_items.length > 3 && (
                            <div className="text-sm text-gray-500">
                              +{order.order_items.length - 3} more items
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(order.status === 'complete' || order.payment_status === 'paid') && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          License keys available
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default withAuth(OrdersPage);
