/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FaCreditCard, FaLock, FaShieldAlt, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
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
    product_id?: string;
    name?: string;
    title?: string;
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
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaCheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Payment Successful!</h3>
        <p className="text-gray-600 mb-4">Your order has been processed successfully.</p>
        <div className="inline-flex items-center text-sm text-gray-500">
          <FaSpinner className="animate-spin w-4 h-4 mr-2" />
          Redirecting to confirmation page...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <FaCreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
            <p className="text-sm text-gray-600">Enter your card details to complete the purchase</p>
          </div>
        </div>
      </div>

      <form onSubmit={handlePayment} className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Card Details
            </label>
            
            <div className="space-y-4">
              {/* Card Number */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 mb-1">Card Number</label>
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 focus-within:border-blue-500 focus-within:bg-white transition-all duration-200">
                  <CardNumberElement
                    options={{
                      style: {
                        base: {
                          fontSize: "16px",
                          color: "#1f2937",
                          fontFamily: "system-ui, -apple-system, sans-serif",
                          "::placeholder": { color: "#9ca3af" },
                        },
                        invalid: {
                          color: "#ef4444",
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Expiry and CVC */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Expiry Date</label>
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 focus-within:border-blue-500 focus-within:bg-white transition-all duration-200">
                    <CardExpiryElement
                      options={{
                        style: {
                          base: {
                            fontSize: "16px",
                            color: "#1f2937",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                            "::placeholder": { color: "#9ca3af" },
                          },
                          invalid: {
                            color: "#ef4444",
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1">CVC</label>
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 focus-within:border-blue-500 focus-within:bg-white transition-all duration-200">
                    <CardCvcElement
                      options={{
                        style: {
                          base: {
                            fontSize: "16px",
                            color: "#1f2937",
                            fontFamily: "system-ui, -apple-system, sans-serif",
                            "::placeholder": { color: "#9ca3af" },
                          },
                          invalid: {
                            color: "#ef4444",
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {paymentError && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <div className="flex items-center">
                <FaExclamationTriangle className="w-5 h-5 text-red-400 mr-3" />
                <p className="text-sm font-medium text-red-800">{paymentError}</p>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <FaLock className="w-4 h-4 mr-2 text-green-600" />
              <span className="font-medium">Secure Payment</span>
            </div>
            <p className="text-xs text-gray-500">
              Your payment information is encrypted and secure. We use industry-standard SSL encryption to protect your data.
            </p>
          </div>

          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
          >
            {isProcessing ? (
              <>
                <FaSpinner className="animate-spin w-5 h-5 mr-3" />
                Processing Payment...
              </>
            ) : (
              <>
                <FaLock className="w-4 h-4 mr-3" />
                Pay ${order?.total_price.toFixed(2)} {order?.currency}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
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
    <>
      <Head>
        <title>Secure Checkout - Lootamo</title>
        <meta name="description" content="Complete your purchase securely with SSL encryption" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Secure Checkout</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Complete your purchase with confidence using our encrypted payment system
            </p>
            <div className="flex items-center justify-center mt-4 space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <FaShieldAlt className="w-4 h-4 mr-2 text-green-600" />
                SSL Secured
              </div>
              <div className="flex items-center">
                <FaLock className="w-4 h-4 mr-2 text-blue-600" />
                256-bit Encryption
              </div>
            </div>
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
                style={{ cursor: "pointer" }}
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
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaCreditCard className="w-5 h-5 mr-2 text-blue-600" />
                Order Items ({order.order_items.length})
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {order.order_items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-xs font-medium rounded-full mr-3">
                            {index + 1}
                          </span>
                          <h4 className="font-semibold text-gray-900">
                            {item.product_name || item.name || item.title || `Product Item #${index + 1}`}
                          </h4>
                        </div>
                        
                        <div className="ml-9 space-y-1">
                          {item.id && (
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">Item ID:</span> #{item.id}
                            </div>
                          )}
                          {item.quantity && (
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">Quantity:</span> {item.quantity}
                            </div>
                          )}
                          {item.price && (
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">Unit Price:</span> ${item.price.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-gray-900">
                          ${item.price ? (item.price * (item.quantity || 1)).toFixed(2) : '0.00'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Total
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Order Summary */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Order Total:</span>
                  <span className="text-xl font-bold text-blue-600">
                    ${order.total_price.toFixed(2)} {order.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
