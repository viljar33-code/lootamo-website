import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { FiDatabase, FiAlertTriangle, FiCheckCircle, FiTrendingUp } from "react-icons/fi";

export default function AdminLogs() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
  }, [router]);

  const batches = [
    { id: "BATCH-1735467870-002", rows: 5200, results: { inserted: 4980, updated: 200, skipped: 15, validated: 5 }, errorRate: 0.3, status: "Completed", ts: "2025-09-02 09:03:00" },
    { id: "BATCH-1735467870-003", rows: 3500, results: { inserted: 3300, updated: 150, skipped: 50, validated: 0 }, errorRate: 1.4, status: "Completed", ts: "2025-09-02 09:05:10" },
    { id: "BATCH-1735467870-004", rows: 2100, results: { inserted: 2100, updated: 0, skipped: 0, validated: 0 }, errorRate: 0.0, status: "Completed", ts: "2025-09-02 09:08:10" },
    { id: "BATCH-1735467870-008", rows: 7500, results: { inserted: 7400, updated: 80, skipped: 20, validated: 0 }, errorRate: 0.3, status: "Completed", ts: "2025-09-02 09:10:00" },
    { id: "BATCH-1735467870-009", rows: 8100, results: { inserted: 8000, updated: 50, skipped: 50, validated: 0 }, errorRate: 0.6, status: "Completed", ts: "2025-09-02 09:21:00" },
  ];

  return (
    <>
      <Head>
        <title>Logs & Monitoring • Lootamo Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-100 flex">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <h1 className="text-xl font-semibold text-gray-900">Logs & Monitoring</h1>

            
            <section className="rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100 shadow-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">System Monitoring & Error Handling</div>
                  <div className="text-sm text-slate-300">
                    Comprehensive logging of all game/software catalog imports, license key deliveries, and system health
                  </div>
                </div>
                <FiTrendingUp className="text-3xl text-slate-300" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                <div className="rounded-lg bg-slate-800/40 p-4 text-center">
                  <div className="text-sm text-slate-300">Import Batches</div>
                  <div className="text-3xl font-bold mt-1">{batches.length}</div>
                </div>
                <div className="rounded-lg bg-slate-800/40 p-4 text-center">
                  <div className="text-sm text-slate-300">Quarantined Records</div>
                  <div className="text-3xl font-bold mt-1">12</div>
                </div>
                <div className="rounded-lg bg-slate-800/40 p-4 text-center">
                  <div className="text-sm text-slate-300">Successful Deliveries</div>
                  <div className="text-3xl font-bold mt-1">670</div>
                </div>
                <div className="rounded-lg bg-slate-800/40 p-4 text-center">
                  <div className="text-sm text-slate-300">System Uptime</div>
                  <div className="text-3xl font-bold mt-1">99.7%</div>
                </div>
              </div>
            </section>

            
            <section className="bg-white rounded-xl shadow-lg p-5 border">
  <div className="flex items-center gap-2 mb-3">
    <FiDatabase />
    <h2 className="font-semibold">Catalog Import Logs</h2>
  </div>

  {/* Table for large screens */}
  <div className="overflow-x-auto hidden lg:block">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="text-left text-gray-600 border-b">
          <th className="py-2 pr-4">Batch ID</th>
          <th className="py-2 pr-4">Total Rows</th>
          <th className="py-2 pr-4">Results</th>
          <th className="py-2 pr-4">Error Rate</th>
          <th className="py-2 pr-4">Status</th>
          <th className="py-2 pr-4">Timestamp</th>
          <th className="py-2 pr-4">Actions</th>
        </tr>
      </thead>
      <tbody>
        {batches.map((b) => (
          <tr
            key={b.id}
            className="border-b last:border-0 hover:bg-gray-50 transition-all"
          >
            <td className="py-2 pr-4 text-rose-600 font-mono text-xs">{b.id}</td>
            <td className="py-2 pr-4">{b.rows}</td>
            <td className="py-2 pr-4 flex flex-wrap gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                {b.results.inserted} inserted
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                {b.results.updated} updated
              </span>
              {b.results.skipped > 0 && (
                <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                  {b.results.skipped} skipped
                </span>
              )}
              {b.results.validated > 0 && (
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                  {b.results.validated} validated
                </span>
              )}
            </td>
            <td className="py-2 pr-4">
              <div className="w-24 h-2 bg-gray-200 rounded">
                <div
                  className={`h-2 rounded ${
                    b.errorRate > 1 ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, b.errorRate)}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {b.errorRate.toFixed(1)}%
              </div>
            </td>
            <td className="py-2 pr-4">
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                {b.status}
              </span>
            </td>
            <td className="py-2 pr-4">{b.ts}</td>
            <td className="py-2 pr-4">
              <button className="text-xs px-2 py-0.5 rounded border hover:bg-gray-50">
                Details
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Card layout for small screens */}
  <div className="space-y-4 block lg:hidden">
    {batches.map((b) => (
      <div
        key={b.id}
        className="border rounded-lg p-4 shadow-sm bg-gray-50 space-y-2"
      >
        <div className="text-xs text-gray-500 font-mono">{b.id}</div>
        <div className="text-sm">
          <span className="font-medium">Rows:</span> {b.rows}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
            {b.results.inserted} inserted
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
            {b.results.updated} updated
          </span>
          {b.results.skipped > 0 && (
            <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700">
              {b.results.skipped} skipped
            </span>
          )}
          {b.results.validated > 0 && (
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              {b.results.validated} validated
            </span>
          )}
        </div>
        <div>
          <div className="w-full h-2 bg-gray-200 rounded">
            <div
              className={`h-2 rounded ${
                b.errorRate > 1 ? "bg-rose-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, b.errorRate)}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Error: {b.errorRate.toFixed(1)}%
          </div>
        </div>
        <div className="text-sm">
          <span className="font-medium">Status:</span>{" "}
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
            {b.status}
          </span>
        </div>
        <div className="text-sm">
          <span className="font-medium">Timestamp:</span> {b.ts}
        </div>
        <div>
          <button className="text-xs px-2 py-0.5 rounded border hover:bg-gray-100">
            Details
          </button>
        </div>
      </div>
    ))}
  </div>
</section>


            
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-white rounded-xl shadow-lg p-5 border">
                <div className="flex items-center gap-2 mb-2">
                  <FiAlertTriangle />
                  <h3 className="font-semibold">Error Handling & Recovery</h3>
                </div>
                <div className="mt-2 text-xs font-mono bg-gray-50 border rounded p-3 space-y-2">
                  <div>[2025-09-02 09:05:13] VALIDATION_WARN - row 128: missing required field price</div>
                  <div>[2025-09-02 09:05:14] QUARANTINE - moved row to quarantine table for manual review</div>
                  <div>[2025-09-02 09:06:12] DUPLICATE_SKU - SKU=BOXI-CODER2-2924 detected, skipping row</div>
                  <div>[2025-09-02 09:10:21] IMPORT_COMPLETE - batch processed: 5200 rows inserted, 1 failed</div>
                </div>
                <div className="mt-3 text-sm text-gray-700">
                  <div className="font-medium">Error Handling Features</div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Row-level error logging</li>
                    <li>Quarantine table for recovery</li>
                    <li>Duplicate detection on core columns</li>
                    <li>Delayed retry logic with backoff</li>
                  </ul>
                </div>
              </div>

              
              <div className="bg-white rounded-xl shadow-lg p-5 border">
                <div className="flex items-center gap-2 mb-2">
                  <FiCheckCircle />
                  <h3 className="font-semibold">Retry Logic & Monitoring</h3>
                </div>
                <div className="mt-2 text-xs font-mono bg-gray-50 border rounded p-3 space-y-2">
                  <div>[2025-09-03 11:13:01] DELIVERY_RETRY - order 882: network timeout, scheduling retry in 30s</div>
                  <div>[2025-09-03 11:13:32] DELIVERY_RETRY - retry 1/3 for order 882</div>
                  <div>[2025-09-03 11:13:55] DELIVERY_SUCCESS - license key delivered to customer@company.com</div>
                </div>
                <div className="mt-3 text-sm text-gray-700">
                  <div className="font-medium">Retry & Recovery Features</div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Exponential backoff retry logic</li>
                    <li>Idempotent delivery pipeline</li>
                    <li>Automated failure recovery</li>
                    <li>Manual retry capabilities</li>
                  </ul>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
