import Head from "next/head";
import { FiUploadCloud, FiKey, FiActivity } from "react-icons/fi";
import AdminLayout from "@/components/layouts/AdminLayout";

export default function AdminDashboard() {

  return (
    <>
      <Head>
        <title>Dashboard • Lootamo Admin</title>
      </Head>
      <AdminLayout>
        <div className="space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">System Overview</h1>
            </div>

            
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-sm">
              Welcome back, <span className="font-medium">System Administrator</span>!
            </div>

            
            <section className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100 shadow p-6">
              <h2 className="text-lg font-semibold">Catalog & License Management</h2>
              <p className="text-sm text-slate-300 mt-1">
                Overview of games/software products, license keys, and orders.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="rounded-lg bg-slate-800/40 p-4">
                  <div className="text-3xl font-bold">2,500</div>
                  <div className="text-sm text-slate-300">Products in Catalog</div>
                </div>
                <div className="rounded-lg bg-slate-800/40 p-4">
                  <div className="text-3xl font-bold">49,549</div>
                  <div className="text-sm text-slate-300">Available License Keys</div>
                </div>
                <div className="rounded-lg bg-slate-800/40 p-4">
                  <div className="text-3xl font-bold">670</div>
                  <div className="text-sm text-slate-300">Orders Delivered</div>
                </div>
                <div className="rounded-lg bg-slate-800/40 p-4">
                  <div className="text-3xl font-bold">7</div>
                  <div className="text-sm text-slate-300">Import Batches Processed</div>
                </div>
              </div>
            </section>

            
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-white rounded-xl shadow p-5 border hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded bg-blue-100 text-blue-700"><FiUploadCloud className="text-xl" /></span>
                  <h3 className="font-semibold">Catalog Import & Sync</h3>
                </div>
                <p className="text-sm text-gray-600 mt-2">Import large game/software catalogs efficiently.</p>
                <button className="mt-4 px-3 py-1.5 text-sm rounded bg-slate-900 text-white hover:bg-slate-800 transition-all duration-300">Try Import</button>
              </div>

              
              <div className="bg-white rounded-xl shadow p-5 border hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded bg-emerald-100 text-emerald-700"><FiKey className="text-xl" /></span>
                  <h3 className="font-semibold">License Key Delivery</h3>
                </div>
                <p className="text-sm text-gray-600 mt-2">Automatic license key assignment for purchased games/software.</p>
                <button className="mt-4 px-3 py-1.5 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-300">Place Order</button>
              </div>

              
              <div className="bg-white rounded-xl shadow p-5 border hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded bg-amber-100 text-amber-700"><FiActivity className="text-xl" /></span>
                  <h3 className="font-semibold">Monitoring & Logging</h3>
                </div>
                <p className="text-sm text-gray-600 mt-2">Track imports, deliveries, and system performance.</p>
                <button className="mt-4 px-3 py-1.5 text-sm rounded bg-amber-500 text-white hover:bg-amber-600 transition-all duration-300">View Logs</button>
              </div>
            </section>
        </div>
      </AdminLayout>
    </>
  );
}
