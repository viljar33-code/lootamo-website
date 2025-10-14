/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { FaCreditCard, FaLock, FaShieldAlt, FaSpinner } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface Order {
  id: number;
  g2a_order_id: string | null;
  product_id: string | null;
  price: number | null;
  total_price: number;
  currency: string;
  status: string;
  payment_status: string;
  stripe_payment_intent_id: string | null;
  delivered_key: string | null;
  created_at: string;
  updated_at: string;
  order_items: {
    id?: number;
    product_name?: string;
    price?: number;
    quantity?: number;
  }[];
}


const CheckoutForm: React.FC<{ order: Order | null }> = ({ order }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !order) return;

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Create payment intent using service
      const { checkoutService } = await import('../services/checkoutService');
      const paymentData = await checkoutService.createPaymentIntent({
        order_id: order.id
      });

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardNumberElement);
      if (!cardElement) return;

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paymentData.client_secret,
        {
          payment_method: {
            card: cardElement,
          }
        }
      );

      if (error) {
        setPaymentError(error.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded') {
        setPaymentSuccess(true);
        await clearCart();
        setTimeout(() => {
          router.push(`/payment-success?orderId=${order.id}`);
        }, 1500);
      }
    } catch (error) {
      setPaymentError('Payment processing failed. Please try again.');
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaSpinner className="animate-spin w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment...</h3>
        <p className="text-gray-600">Redirecting to confirmation page...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handlePayment} className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center mb-4">
          <FaCreditCard className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
        </div>
        
        <div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Card Information
  </label>

  <div className="space-y-3">
    {/* Card Number */}
    <div className="border border-gray-300 rounded-lg p-3 bg-white">
      <CardNumberElement
        options={{
          style: {
            base: {
              fontSize: "16px",
              color: "#424770",
              "::placeholder": { color: "#aab7c4" },
            },
          },
        }}
      />
    </div>

    {/* Expiry Date */}
    <div className="border border-gray-300 rounded-lg p-3 bg-white">
      <CardExpiryElement
        options={{
          style: {
            base: {
              fontSize: "16px",
              color: "#424770",
              "::placeholder": { color: "#aab7c4" },
            },
          },
        }}
      />
    </div>

    {/* CVC */}
    <div className="border border-gray-300 rounded-lg p-3 bg-white">
      <CardCvcElement
        options={{
          style: {
            base: {
              fontSize: "16px",
              color: "#424770",
              "::placeholder": { color: "#aab7c4" },
            },
          },
        }}
      />
    </div>
  </div>
</div>

        {paymentError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{paymentError}</p>
          </div>
        )}

        <div className="flex items-center text-sm text-gray-500 mb-4">
          <FaLock className="w-4 h-4 mr-2" />
          <span>Your payment information is secure and encrypted</span>
        </div>

        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <FaSpinner className="animate-spin w-4 h-4 mr-2" />
              Processing Payment...
            </>
          ) : (
            `Pay $${order?.total_price.toFixed(2)} ${order?.currency}`
          )}
        </button>
      </div>
    </form>
  );
};

export default function Checkout() {
  const router = useRouter();
  const { orderId } = router.query;
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const { checkoutService } = await import('../services/checkoutService');
      const orderData = await checkoutService.getOrderById(parseInt(orderId as string));
      setOrder(orderData);
    } catch (error) {
      setError('Failed to load order details');
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading checkout details...</p>
      </div>
    </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaShieldAlt className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/cart')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaShieldAlt className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The requested order could not be found.</p>
          <button
            onClick={() => router.push('/cart')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your purchase securely</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-4">
              {user && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer Email:</span>
                  <span className="font-medium">{user.email}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">#{order.id}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  {order.status}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                  {order.payment_status}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <hr className="border-gray-200" />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${order.total_price.toFixed(2)} {order.currency}</span>
              </div>
            </div>

            {!showPayment && (
              <button
                onClick={() => setShowPayment(true)}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue to Payment
              </button>
            )}
          </div>

          {/* Payment Section */}
          {showPayment && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <Elements stripe={stripePromise}>
                <CheckoutForm order={order} />
              </Elements>
            </div>
          )}
          {!showPayment && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Secure Payment</h3>
              <div className="space-y-3 text-gray-600">
                <div className="flex items-center">
                  <FaShieldAlt className="w-5 h-5 text-green-600 mr-3" />
                  <span>SSL encrypted checkout</span>
                </div>
                <div className="flex items-center">
                  <FaCreditCard className="w-5 h-5 text-blue-600 mr-3" />
                  <span>Secure card processing</span>
                </div>
                <div className="flex items-center">
                  <FaLock className="w-5 h-5 text-gray-600 mr-3" />
                  <span>Your data is protected</span>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Click "Continue to Payment" to proceed with your secure checkout.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Order Items */}
        {order.order_items && order.order_items.length > 0 && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-3">
              {order.order_items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <span className="font-medium">Item #{index + 1}</span>
                    {item.product_name && (
                      <span className="text-gray-500 ml-2">{item.product_name}</span>
                    )}
                  </div>
                  <div className="text-right">
                    {item.price && (
                      <div className="font-medium">${item.price.toFixed(2)}</div>
                    )}
                    {item.quantity && (
                      <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
