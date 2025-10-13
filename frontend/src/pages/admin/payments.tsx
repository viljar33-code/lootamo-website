import Head from "next/head";
import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiRefreshCw, FiClock, FiChevronLeft, FiChevronRight, FiX, FiCheck } from "react-icons/fi";
import AdminLayout from '@/components/layouts/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmationModal from "@/components/ConfirmationModal";
import withAdminAuth from "@/hocs/withAdminAuth";

interface PaymentRecord {
  id: string;
  orderId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  customerEmail: string;
  createdAt: string;
  paidAt?: string;
  g2aOrderId?: string;
  licenseDelivered: boolean;
  productName?: string;
  customerName?: string;
  orderItems?: number;
}

interface PaymentStats {
  totalRevenue: number;
  todayRevenue: number;
  pendingPayments: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
}

interface OrderData {
  user_id?: number;
  user_name?: string;
  user_email?: string;
  product_name?: string;
  total_price?: number;
  currency?: string;
  order_items?: number;
  order_status?: string;
  payment_status?: string;
  order_date?: string;
}

function AdminPayments() {
  const { api } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    todayRevenue: 0,
    pendingPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
    refundedPayments: 0
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'failed' | 'refunded'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    paymentId: string;
    customerName: string;
  }>({ isOpen: false, paymentId: '', customerName: '' });

  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/admin/all?limit=1000');
      const orders = response.data.orders || [];
      
      const paymentRecords: PaymentRecord[] = orders.map((order: OrderData, index: number) => ({
        id: `${order.user_id || 'unknown'}_${index}`,
        orderId: `${order.user_id || 'unknown'}_${index}`,
        stripePaymentIntentId: `payment_${order.user_id || 'unknown'}_${index}`,
        amount: order.total_price || 0,
        currency: order.currency || 'EUR',
        status: order.payment_status || 'pending',
        customerEmail: order.user_email || 'N/A',
        createdAt: order.order_date || new Date().toISOString(),
        paidAt: order.payment_status === 'paid' ? order.order_date : undefined,
        g2aOrderId: undefined,
        licenseDelivered: order.order_status === 'complete',
        productName: order.product_name,
        customerName: order.user_name,
        orderItems: order.order_items || 1
      }));
      
      setPayments(paymentRecords);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const totalRevenue = payments
        .filter((payment: PaymentRecord) => payment.status === 'paid')
        .reduce((sum: number, payment: PaymentRecord) => sum + payment.amount, 0);
      
      const today = new Date().toDateString();
      const todayRevenue = payments
        .filter((payment: PaymentRecord) => payment.status === 'paid' && payment.createdAt && new Date(payment.createdAt).toDateString() === today)
        .reduce((sum: number, payment: PaymentRecord) => sum + payment.amount, 0);
      
      const pendingPayments = payments.filter((payment: PaymentRecord) => payment.status === 'pending').length;
      const successfulPayments = payments.filter((payment: PaymentRecord) => payment.status === 'paid').length;
      const failedPayments = payments.filter((payment: PaymentRecord) => payment.status === 'failed').length;
      const refundedPayments = payments.filter((payment: PaymentRecord) => payment.status === 'refunded').length;
      
      setStats({
        totalRevenue,
        todayRevenue,
        pendingPayments,
        successfulPayments,
        failedPayments,
        refundedPayments
      });
    } catch (error) {
      console.error('Failed to calculate payment stats:', error);
      setStats({
        totalRevenue: 0,
        todayRevenue: 0,
        pendingPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
        refundedPayments: 0
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <FiCheck className="text-green-600" />;
      case 'failed':
        return <FiX className="text-red-600" />;
      case 'pending':
        return <FiClock className="text-yellow-600" />;
      case 'refunded':
        return <FiRefreshCw className="text-blue-600" />;
      default:
        return <FiClock className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteClick = (payment: PaymentRecord) => {
    setDeleteModal({
      isOpen: true,
      paymentId: payment.id,
      customerName: payment.customerName || payment.customerEmail
    });
  };

  const handleDeleteConfirm = async () => {
    try {      
      await fetchPayments();
      
      setDeleteModal({ isOpen: false, paymentId: '', customerName: '' });
    } catch (error) {
      console.error('Failed to delete payment:', error);

    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, paymentId: '', customerName: '' });
  };

  const filteredPayments = filter === 'all' 
    ? payments 
    : payments.filter(payment => payment.status === filter);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };


  return (
    <>
      <Head>
        <title>Payment Processing • Lootamo Admin</title>
      </Head>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-blue-600 text-white px-6 py-8 rounded-xl">
            <h1 className="text-2xl font-bold">Payment Processing</h1>
            <p className="text-blue-100 mt-2">Monitor Stripe payments, webhooks, and transaction status</p>
          </div>

          {/* Payment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
            <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">€{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500">
                  <FiDollarSign className="text-xl text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-700 font-semibold">+€{stats.todayRevenue}</span>
                <span className="text-gray-600 ml-1">today</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Successful Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.successfulPayments}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500">
                  <FiCheck className="text-xl text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Pending Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-500">
                  <FiClock className="text-xl text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-100 to-red-200 rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Failed Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.failedPayments}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-500">
                  <FiX className="text-xl text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mx-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiDollarSign className="text-blue-600 text-lg" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Payment Transactions</h2>
              </div>
              <button
                onClick={fetchPayments}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold"
              >
                <FiRefreshCw className="text-sm" />
                Refresh
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              {['all', 'pending', 'paid', 'failed', 'refunded'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as 'all' | 'pending' | 'paid' | 'failed' | 'refunded')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    filter === status
                      ? 'bg-blue-600 text-white shadow-lg transform -translate-y-0.5'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Payment Table */}
            <div className="overflow-x-auto bg-gray-50 rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">#</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Order ID</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Product</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Customer</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Amount</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">License</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading payments...</p>
                      </td>
                    </tr>
                  ) : currentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12">
                        <div className="p-3 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                          <FiDollarSign className="text-gray-400 text-lg" />
                        </div>
                        <p className="text-gray-500 font-medium">No payments found</p>
                        <p className="text-gray-400 text-sm mt-1">Payments will appear here once processed</p>
                      </td>
                    </tr>
                  ) : (
                    currentPayments.map((payment, index) => (
                      <tr key={payment.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-900">{startIndex + index + 1}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-900">#{payment.orderId}</div>
                          <div className="text-xs text-gray-500 font-mono">{payment.stripePaymentIntentId}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-sm text-gray-900">{payment.productName || 'Unknown Product'}</div>
                          <div className="text-xs text-gray-500">{payment.orderItems || 1} item(s)</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-sm text-gray-900">{payment.customerName || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{payment.customerEmail}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-gray-900">€{payment.amount}</div>
                          <div className="text-xs text-gray-500">{payment.currency}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(payment.status)}
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1">
                            {payment.licenseDelivered ? (
                              <span className="text-green-600 text-sm font-semibold">✓ Delivered</span>
                            ) : (
                              <span className="text-gray-500 text-sm">Pending</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(payment.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 space-x-2">
                {/* Previous button */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === '...' ? (
                      <span className="px-3 py-2 text-gray-500">...</span>
                    ) : (
                      <button
                        onClick={() => setCurrentPage(page as number)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}

                {/* Next button */}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Payment Record"
          message={`Are you sure you want to delete the payment record for ${deleteModal.customerName}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </AdminLayout>
    </>
  );
}

export default withAdminAuth(AdminPayments);
