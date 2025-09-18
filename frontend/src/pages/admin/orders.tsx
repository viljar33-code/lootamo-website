import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { 
  FiMail, 
  FiShoppingCart, 
  FiLock, 
  FiKey, 
  FiArrowRightCircle, 
  FiRefreshCw, 
  FiEye, 
  FiSend 
} from "react-icons/fi";

type Order = {
  id: string;
  email: string;
  product: string;
  status: string;
  key: string | null;
  created: string;
};

export default function AdminOrders() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [product, setProduct] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Mock data for orders
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
      // In a real app, you would call your API here
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
        <div className="space-y-6 p-6">
          <h1 className="text-2xl font-semibold text-gray-900">Orders & License Delivery</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* New Order Form */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-5 border hover:shadow-xl transition-all duration-300">
              <h2 className="text-lg font-semibold mb-4">Place New Order</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                    <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
                      <FiMail className="text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="customer@company.com"
                        className="w-full py-1 text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                    <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
                      <FiShoppingCart className="text-gray-400" />
                      <select
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        className="w-full py-1 text-sm outline-none bg-transparent"
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

                <div className="rounded-lg border bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <FiLock className="mt-0.5 text-emerald-600" />
                    <div>
                      <h3 className="font-medium text-emerald-800">Secure Order Processing</h3>
                      <p className="text-sm text-emerald-700">All orders are processed securely with end-to-end encryption.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={!email || !product || submitting}
                  className={`w-full flex items-center justify-center py-2 px-4 rounded-md text-white ${
                    !email || !product || submitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <FiArrowRightCircle className="mr-2" />
                  {submitting ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-lg p-5 border hover:shadow-xl transition-all duration-300">
              <h2 className="text-lg font-semibold mb-4">Recent Orders</h2>
              <div className="space-y-4">
                {orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">Order #{order.id}</p>
                            <p className="text-xs text-gray-500">{order.email}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            order.status === 'Completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-sm mt-2">{order.product}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">No orders yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
