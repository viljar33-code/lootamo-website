import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  PrinterIcon, 
  DocumentArrowDownIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { orderService, Order, LicenseKeysResponse, ProductDetails } from '../services/orderService';

interface OrderDetailsProps {
  orderId: number;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ orderId }) => {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [order, setOrder] = useState<Order | null>(null);
  const [licenseKeys, setLicenseKeys] = useState<LicenseKeysResponse | null>(null);
  
  const [productDetails, setProductDetails] = useState<{ [key: string]: ProductDetails }>({});
  const [loading, setLoading] = useState(true);
  const [licenseKeysLoading, setLicenseKeysLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const orderData = await orderService.getOrder(orderId);
      setOrder(orderData);

      const productIds = new Set<string>();
      if (orderData.product_id) {
        productIds.add(orderData.product_id);
      }
      orderData.order_items?.forEach(item => {
        if (item.product_id) {
          productIds.add(item.product_id);
        }
      });

      const productDetailsMap: { [key: string]: ProductDetails } = {};
      for (const productId of productIds) {
        try {
          const product = await orderService.getProductDetails(productId);
          productDetailsMap[productId] = product;
        } catch (err) {
          console.warn(`Failed to fetch product details for ${productId}:`, err);
        }
      }
      setProductDetails(productDetailsMap);

      if (orderData.payment_status === 'paid' || orderData.status === 'complete') {
        await fetchLicenseKeys();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchLicenseKeys = async () => {
    try {
      setLicenseKeysLoading(true);
      const keysData = await orderService.getOrderLicenseKeys(orderId);      
      setLicenseKeys(keysData);
    } catch (err) {
      console.warn('Failed to fetch license keys:', err);
    } finally {
      setLicenseKeysLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      const blob = await orderService.downloadOrderPDF(orderId);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `order-${orderId}-invoice.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to download invoice');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Order</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"

          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hidden in print */}
      <div className="bg-blue-50 border-b border-gray-200 print:hidden">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4 min-h-[60px] sm:h-16">
            <div className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => router.back()}
                className="mr-2 sm:mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                style={{ cursor: "pointer" }}
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                Order #{order.id}
              </h1>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden sm:flex space-x-3 flex-shrink-0">
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                style={{ cursor: "pointer" }}
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                style={{ cursor: "pointer" }}
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                {downloadingPDF ? 'Downloading...' : 'Download PDF'}
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="flex sm:hidden space-x-2 flex-shrink-0">
              <button
                onClick={handlePrint}
                className="p-2 text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ cursor: "pointer" }}
                title="Print"
              >
                <PrinterIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="p-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                style={{ cursor: "pointer" }}
                title={downloadingPDF ? 'Downloading...' : 'Download PDF'}
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4" ref={printRef}>
        {/* Order Summary */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 mb-4 sm:mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Order Summary</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Order ID</label>
                <p className="text-xl font-bold text-gray-900">#{order.id}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${order.status === 'complete' ? 'bg-green-100 text-green-800' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1">{orderService.formatOrderStatus(order.status)}</span>
                </span>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Total Amount</label>
                <p className="text-xl font-bold text-gray-900">
                  €{order.total_price.toFixed(2)}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Order Date</label>
                <p className="text-base font-bold text-gray-900">
                  {new Date(order.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {order.stripe_payment_intent_id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Payment Status</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {orderService.formatOrderStatus(order.payment_status)}
                    </span>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Payment ID</label>
                    <p className="text-xs text-gray-900 font-mono bg-white px-2 py-1 rounded-lg border">{order.stripe_payment_intent_id}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 mb-4 sm:mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Order Items</h2>
          </div>
          <div className="p-4 sm:p-6">
            {order.order_items && order.order_items.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {order.order_items.map((item, index) => {
                  const product = productDetails[item.product_id];
                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-3 sm:p-4 bg-gray-50 border-2 border-gray-100 rounded-xl hover:border-blue-200 transition-all duration-200">
                      {/* Mobile Layout */}
                      <div className="flex items-start space-x-3 sm:hidden">
                        {product?.thumbnail ? (
                          <img
                            src={product.thumbnail}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg shadow-md flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-500 text-xs font-medium">No Image</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">
                            {product?.name || `Product ${item.product_id}`}
                          </h3>
                          {product?.developer && (
                            <p className="text-sm text-gray-600 mb-2">by {product.developer}</p>
                          )}
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:flex sm:items-center sm:space-x-4">
                        {product?.thumbnail ? (
                          <img
                            src={product.thumbnail}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg shadow-md flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-500 text-xs font-medium">No Image</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {product?.name || `Product ${item.product_id}`}
                          </h3>
                          {product?.developer && (
                            <p className="text-sm text-gray-600 mb-2">by {product.developer}</p>
                          )}
                        </div>
                      </div>

                      {/* Item Details */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <div className="bg-white px-2 py-1 rounded border">
                          <span className="text-xs font-semibold text-gray-500">Qty: </span>
                          <span className="text-xs font-bold text-gray-900">{item.quantity}</span>
                        </div>
                        <div className="bg-white px-2 py-1 rounded border">
                          <span className="text-sm font-bold text-gray-900">€{item.price.toFixed(2)}</span>
                        </div>
                        <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${item.status === 'complete' ? 'bg-green-100 text-green-800' : item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1">{orderService.formatOrderStatus(item.status)}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : order.product_id ? (
              <div className="flex items-center space-x-4 p-4 bg-gray-50 border-2 border-gray-100 rounded-xl">
                {productDetails[order.product_id]?.thumbnail ? (
                  <img
                    src={productDetails[order.product_id].thumbnail}
                    alt={productDetails[order.product_id].name}
                    className="w-16 h-16 object-cover rounded-lg shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-xs font-medium">No Image</span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {productDetails[order.product_id]?.name || `Product ${order.product_id}`}
                  </h3>
                  {productDetails[order.product_id]?.developer && (
                    <p className="text-sm text-gray-600 mb-2">by {productDetails[order.product_id].developer}</p>
                  )}
                  <div className="flex items-center space-x-4">
                    <div className="bg-white px-2 py-1 rounded border">
                      <span className="text-xs font-semibold text-gray-500">Qty: </span>
                      <span className="text-xs font-bold text-gray-900">1</span>
                    </div>
                    <div className="bg-white px-2 py-1 rounded border">
                      <span className="text-sm font-bold text-gray-900">€{order.price?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500">No items found</p>
              </div>
            )}
          </div>
        </div>

        {/* License Keys Section */}
        {(order.payment_status === 'paid' || order.status === 'complete') && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">License Keys</h2>
              {licenseKeysLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
              )}
            </div>
            <div className="p-4 sm:p-6">
              {licenseKeys ? (
                <div className="space-y-3 sm:space-y-4">
                  {licenseKeys.license_keys.length > 0 ? (
                    <>
                      <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                        <div className="flex items-center justify-center">
                          <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2" />
                          <p className="text-sm sm:text-base font-bold text-green-800 text-center">
                            {licenseKeys.completed_items} of {licenseKeys.total_items} license keys ready
                          </p>
                        </div>
                      </div>
                      
                      {licenseKeys.license_keys.map((key, index) => {
                        const product = productDetails[key.product_id];
                        const keyId = `${key.order_item_id}-${key.product_id}`;
                        const isVisible = showKeys[keyId];
                        
                        return (
                          <div key={keyId} className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl hover:border-green-300 transition-all duration-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2">
                                {product?.name || `Product ${key.product_id}`}
                              </h3>
                              <span className="text-xs font-bold text-green-700 bg-green-200 px-3 py-1 rounded-full self-start sm:self-auto">
                                Ready
                              </span>
                            </div>
                            
                            <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm sm:text-base font-bold text-gray-700">License Key</label>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => toggleKeyVisibility(keyId)}
                                    className="p-1.5 sm:p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all duration-200"
                                    style={{ cursor: "pointer" }}
                                    title={isVisible ? 'Hide key' : 'Show key'}
                                  >
                                    {isVisible ? (
                                      <EyeSlashIcon className="h-4 w-4" />
                                    ) : (
                                      <EyeIcon className="h-4 w-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(key.license_key, 'License key')}
                                    className="p-1.5 sm:p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all duration-200"
                                    style={{ cursor: "pointer" }}
                                    title="Copy to clipboard"
                                  >
                                    <ClipboardDocumentIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="font-mono text-xs sm:text-sm bg-gray-50 p-2 sm:p-3 rounded-lg border text-center font-bold break-all">
                                {isVisible ? key.license_key : '•'.repeat(key.license_key.length)}
                              </div>
                            </div>
                            
                            {key.g2a_order_id && (
                              <div className="mt-3 text-xs text-gray-600 bg-white px-2 sm:px-3 py-2 rounded-lg border">
                                <span className="font-semibold">G2A Order ID:</span> {key.g2a_order_id}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ClockIcon className="h-8 w-8 text-yellow-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">License Keys Pending</h3>
                      <p className="text-gray-600 mb-4">
                        Your license keys are being processed. This usually takes a few minutes.
                      </p>
                      <button
                        onClick={fetchLicenseKeys}
                        disabled={licenseKeysLoading}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl font-semibold"
                      >
                        {licenseKeysLoading ? 'Checking...' : 'Check Again'}
                      </button>
                    </div>
                  )}
                  
                  {licenseKeys.pending_keys.length > 0 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl">
                      <h4 className="text-base font-bold text-yellow-800 mb-3">Pending Items</h4>
                      <div className="space-y-3">
                        {licenseKeys.pending_keys.map((pending, index) => {
                          const product = productDetails[pending.product_id];
                          return (
                            <div key={`${pending.order_item_id}-${pending.product_id}`} className="bg-white p-3 rounded-lg border border-yellow-200">
                              <span className="font-bold text-yellow-800">
                                {product?.name || `Product ${pending.product_id}`}
                              </span>
                              <p className="text-yellow-700 text-sm mt-1">{pending.message}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClockIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Loading License Keys</h3>
                  <p className="text-gray-600 mb-4">
                    Please wait while we retrieve your license keys...
                  </p>
                  <button
                    onClick={fetchLicenseKeys}
                    disabled={licenseKeysLoading}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl font-semibold"
                  >
                    {licenseKeysLoading ? 'Loading...' : 'Retry'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          
          body {
            background: white !important;
          }
          
          .bg-gray-50 {
            background: white !important;
          }
          
          .shadow-sm,
          .shadow {
            box-shadow: none !important;
          }
          
          .border {
            border: 1px solid #e5e7eb !important;
          }
          
          .rounded-lg {
            border-radius: 0.5rem !important;
          }
          
          .text-blue-600 {
            color: #2563eb !important;
          }
          
          .bg-blue-100 {
            background-color: #dbeafe !important;
          }
          
          .text-green-600 {
            color: #16a34a !important;
          }
          
          .bg-green-100 {
            background-color: #dcfce7 !important;
          }
          
          .text-yellow-600 {
            color: #ca8a04 !important;
          }
          
          .bg-yellow-100 {
            background-color: #fef3c7 !important;
          }
          
          .text-red-600 {
            color: #dc2626 !important;
          }
          
          .bg-red-100 {
            background-color: #fee2e2 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderDetails;
