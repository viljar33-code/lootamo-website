import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { FaSpinner, FaEnvelope, FaCheck } from 'react-icons/fa';
import Link from 'next/link';

interface Order {
  id: number;
  total_price: number;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
  order_items: {
    id?: number;
    product_name?: string;
    price?: number;
    quantity?: number;
  }[];
}

export default function PaymentSuccess() {
  const router = useRouter();
  const { orderId } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectCountdown, setRedirectCountdown] = useState(10);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          router.push('/profile/orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const fetchOrderDetails = async () => {
    try {
      const { checkoutService } = await import('../services/checkoutService');
      const orderData = await checkoutService.getOrderById(parseInt(orderId as string));
      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading order details...</p>
      </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Success Animation Section */}
        <div className="p-8 text-center">
          {/* Animated Success Circle */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            {/* Outer rings - centered using transform */}
            <div className="absolute top-1/2 left-1/2 w-40 h-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-100 opacity-20 animate-ping"></div>
            <div className="absolute top-1/2 left-1/2 w-36 h-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-200 opacity-30 animate-ping" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-300 opacity-40 animate-ping" style={{animationDelay: '1s'}}></div>
            
            {/* Main success circle */}
            <div className="relative w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg z-10">
              <FaCheck className="w-12 h-12 text-white animate-bounce" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful</h1>
          {order && (
            <>
              <p className="text-gray-600 mb-6">
                Transaction Number: <span className="font-mono text-sm">{order.id.toString().padStart(8, '0')}</span>
              </p>
              
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-2">Amount paid</p>
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    ${order.total_price.toFixed(2)}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Paid by <span className="text-blue-600 font-medium">Stripe</span>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* License Key Information */}
        <div className="px-8 pb-6">
          <div className="bg-blue-50 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center mb-3">
              <FaEnvelope className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-blue-900">License Key Delivery</h3>
            </div>
            <p className="text-blue-800 text-center text-sm">
              Your license keys will be delivered to your email address within the next few minutes.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link 
              href="/profile/orders"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-2xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-center block shadow-lg"
            >
              View My Orders
            </Link>
            <Link 
              href="/"
              className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-2xl font-semibold hover:bg-gray-200 transition-colors text-center block"
            >
              Continue Shopping
            </Link>
          </div>

          {/* Auto Redirect Notice */}
          <div className="text-center text-sm text-gray-500 mt-6">
            <div className="flex items-center justify-center mb-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
              <span>Redirecting in {redirectCountdown}s</span>
            </div>
            <button
              onClick={() => router.push('/profile/orders')}
              className="text-blue-600 hover:text-blue-800 underline text-xs"
            >
              Skip waiting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
