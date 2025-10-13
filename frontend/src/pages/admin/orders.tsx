import Head from "next/head";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { FiEye, FiRefreshCw, FiShoppingCart, FiMail, FiLock, FiArrowRightCircle } from "react-icons/fi";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAdminAuth from '@/hocs/withAdminAuth';

// Define Order interface
interface Order {
  id: string;
  email: string;
  product: string;
  status: string;
  key: string | null;
  created: string;
}

interface OrderFilters {
  status: string;
  paymentStatus: string;
  dateRange: string;
  searchTerm: string;
}

interface OrderStats {
  total: number;
  pending: number;
  completed: number;
  failed: number;
  revenue: number;
  created: string;
};

function AdminOrders() {
  const [email, setEmail] = useState("");
  const [product, setProduct] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const mockOrders: Order[] = [
      { id: "ORD-001", email: "customer1@example.com", product: "McAfee Chat Enterprise 2024", status: "Pending", key: null, created: "2023-06-15" },
      { id: "ORD-002", email: "customer2@example.com", product: "The Callisto Protocol (GLOBAL)", status: "Completed", key: "XXXX-XXXX-XXXX-XXXX", created: "2023-06-14" },
    ];
    setOrders(mockOrders);
  }, []);

  const products = useMemo(
    () => [
      { id: "MCAF-CHATEN-2024", name: "McAfee Chat Enterprise 2024" },
      { id: "CALLISTO-PROTOCOL-GLOBAL", name: "The Callisto Protocol (GLOBAL)" },
      { id: "GOTHAM-KNIGHTS-XBOX", name: "Gotham Knights • Xbox/Win10" },
      { id: "IBM-VIDEO-CONF-STD", name: "IBM Video Conferencing Standard" },
    ],
    []
  );

  const placeOrder = async () => {
    if (!email || !product) return;
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      const newOrder: Order = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        email,
        product: products.find(p => p.id === product)?.name || product,
        status: "Pending",
        key: null,
        created: new Date().toISOString().split('T')[0]
      };
      setOrders(prev => [newOrder, ...prev]);
      setEmail("");
      setProduct("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Orders • Lootamo Admin</title>
      </Head>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-blue-600 text-white px-6 py-8 rounded-xl">
            <h1 className="text-2xl font-bold">Orders & License Delivery</h1>
            <p className="text-blue-100 mt-2">Manage customer orders, roles, and access permissions</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6">
            {/* New Order Form */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiShoppingCart className="text-blue-600 text-lg" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Place New Order</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Email</label>
                    <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                      <FiMail className="text-gray-500 text-lg" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="customer@company.com"
                        className="w-full text-sm outline-none placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product</label>
                    <div className="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                      <FiShoppingCart className="text-gray-500 text-lg" />
                      <select
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        className="w-full text-sm outline-none bg-transparent"
                      >
                        <option value="">Select a product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <FiLock className="text-emerald-600 text-lg" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-emerald-800">Secure Order Processing</h3>
                      <p className="text-sm text-emerald-700 mt-1">All orders are processed securely with end-to-end encryption.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={!email || !product || submitting}
                  className={`w-full flex items-center justify-center py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                    !email || !product || submitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  {submitting ? (
                    <FiRefreshCw className="mr-2 animate-spin" />
                  ) : (
                    <FiArrowRightCircle className="mr-2" />
                  )}
                  {submitting ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiEye className="text-green-600 text-lg" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              </div>
              <div className="space-y-4">
                {orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-sm text-gray-900">Order #{order.id}</p>
                            <p className="text-xs text-gray-500 mt-1">{order.email}</p>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            order.status === 'Completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">{order.product}</p>
                        <p className="text-xs text-gray-500 mt-2">Created: {order.created}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="p-3 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <FiShoppingCart className="text-gray-400 text-lg" />
                    </div>
                    <p className="text-gray-500 text-sm">No orders yet</p>
                    <p className="text-gray-400 text-xs mt-1">Orders will appear here once placed</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}

export default withAdminAuth(AdminOrders);
