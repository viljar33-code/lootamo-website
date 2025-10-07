import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { 
  FiDatabase, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiServer,
  FiShield,
  FiRefreshCw,
  FiEye,
  FiDownload,
  FiFilter
} from "react-icons/fi";

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

          <main className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Logs & Monitoring</h1>
                <p className="mt-2 text-gray-600">Real-time system monitoring and comprehensive logging dashboard</p>
              </div>
            </div>

            {/* System Overview Cards */}
            <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">System Monitoring & Error Handling</h2>
                <p className="text-gray-600 mt-1">
                  Comprehensive logging of all game/software catalog imports, license key deliveries, and system health
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Import Batches - Blue Theme */}
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-6 border border-blue-200 hover:from-blue-200 hover:to-blue-300 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-700 text-sm font-medium">Import Batches</p>
                      <p className="text-3xl font-bold mt-2 text-gray-900">{batches.length}</p>
                    </div>
                    <div className="p-3 bg-blue-500 rounded-lg">
                      <FiDatabase className="text-2xl text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Quarantined Records - Orange Theme */}
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl p-6 border border-orange-200 hover:from-orange-200 hover:to-orange-300 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-700 text-sm font-medium">Quarantined Records</p>
                      <p className="text-3xl font-bold mt-2 text-gray-900">12</p>
                    </div>
                    <div className="p-3 bg-orange-500 rounded-lg">
                      <FiShield className="text-2xl text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Successful Deliveries - Green Theme */}
                <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-6 border border-green-200 hover:from-green-200 hover:to-green-300 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-700 text-sm font-medium">Successful Deliveries</p>
                      <p className="text-3xl font-bold mt-2 text-gray-900">670</p>
                    </div>
                    <div className="p-3 bg-green-500 rounded-lg">
                      <FiCheckCircle className="text-2xl text-white" />
                    </div>
                  </div>
                </div>
                
                {/* System Uptime - Purple Theme */}
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-6 border border-purple-200 hover:from-purple-200 hover:to-purple-300 transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-700 text-sm font-medium">System Uptime</p>
                      <p className="text-3xl font-bold mt-2 text-gray-900">99.7%</p>
                    </div>
                    <div className="p-3 bg-purple-500 rounded-lg">
                      <FiServer className="text-2xl text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Catalog Import Logs */}
            <section className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FiDatabase className="text-blue-600 text-lg" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Catalog Import Logs</h2>
                      <p className="text-sm text-gray-600">Recent batch processing activities</p>
                    </div>
                  </div>
                  <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    <FiEye className="mr-2 h-4 w-4" />
                    View All
                  </button>
                </div>
              </div>
              
              <div className="p-6">

                {/* Enhanced Table for large screens */}
                <div className="overflow-x-auto hidden lg:block">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Batch ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Rows</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Results</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Error Rate</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Timestamp</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {batches.map((b, index) => (
                        <tr
                          key={b.id}
                          className={`hover:bg-blue-50 transition-colors duration-150 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-blue-600 font-medium">{b.id}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{b.rows.toLocaleString()}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {b.results.inserted} inserted
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {b.results.updated} updated
                              </span>
                              {b.results.skipped > 0 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  {b.results.skipped} skipped
                                </span>
                              )}
                              {b.results.validated > 0 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {b.results.validated} validated
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                                <div
                                  className={`h-2 rounded-full ${
                                    b.errorRate > 1 ? "bg-red-500" : b.errorRate > 0.5 ? "bg-yellow-500" : "bg-green-500"
                                  }`}
                                  style={{ width: `${Math.min(100, b.errorRate * 10)}%` }}
                                />
                              </div>
                              <span className={`text-sm font-medium ${
                                b.errorRate > 1 ? "text-red-600" : b.errorRate > 0.5 ? "text-yellow-600" : "text-green-600"
                              }`}>
                                {b.errorRate.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></div>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {b.ts}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-3 py-1 rounded-md transition-colors">
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Enhanced Card layout for small screens */}
                <div className="space-y-4 block lg:hidden">
                  {batches.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-mono text-blue-600 font-medium">{b.id}</div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></div>
                          {b.status}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Total Rows:</span>
                          <span className="text-sm font-semibold text-gray-900">{b.rows.toLocaleString()}</span>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-2">Results:</div>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {b.results.inserted} inserted
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {b.results.updated} updated
                            </span>
                            {b.results.skipped > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {b.results.skipped} skipped
                              </span>
                            )}
                            {b.results.validated > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {b.results.validated} validated
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-600">Error Rate:</span>
                            <span className={`text-sm font-medium ${
                              b.errorRate > 1 ? "text-red-600" : b.errorRate > 0.5 ? "text-yellow-600" : "text-green-600"
                            }`}>
                              {b.errorRate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                b.errorRate > 1 ? "bg-red-500" : b.errorRate > 0.5 ? "bg-yellow-500" : "bg-green-500"
                              }`}
                              style={{ width: `${Math.min(100, b.errorRate * 10)}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Timestamp:</span>
                          <span className="text-sm text-gray-600">{b.ts}</span>
                        </div>
                        
                        <div className="pt-2">
                          <button className="w-full text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors text-sm font-medium border border-blue-200">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>


            {/* Error Handling & Monitoring Section */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Error Handling Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <FiAlertTriangle className="text-red-600 text-lg" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Error Handling & Recovery</h3>
                      <p className="text-sm text-gray-600">System error management and recovery processes</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="bg-gray-900 rounded-lg p-4 mb-4 font-mono text-xs text-green-400 space-y-1 overflow-x-auto">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500">[2025-09-02 09:05:13]</span>
                      <span className="text-yellow-400">VALIDATION_WARN</span>
                      <span>- row 128: missing required field price</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500">[2025-09-02 09:05:14]</span>
                      <span className="text-orange-400">QUARANTINE</span>
                      <span>- moved row to quarantine table for manual review</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500">[2025-09-02 09:06:12]</span>
                      <span className="text-red-400">DUPLICATE_SKU</span>
                      <span>- SKU=BOXI-CODER2-2924 detected, skipping row</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500">[2025-09-02 09:10:21]</span>
                      <span className="text-green-400">IMPORT_COMPLETE</span>
                      <span>- batch processed: 5200 rows inserted, 1 failed</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Error Handling Features</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Row-level error logging with detailed context
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Quarantine table for manual recovery
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Duplicate detection on core columns
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Delayed retry logic with exponential backoff
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Retry Logic Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FiCheckCircle className="text-green-600 text-lg" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Retry Logic & Monitoring</h3>
                      <p className="text-sm text-gray-600">Automated retry mechanisms and delivery tracking</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="bg-gray-900 rounded-lg p-4 mb-4 font-mono text-xs text-green-400 space-y-1 overflow-x-auto">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500">[2025-09-03 11:13:01]</span>
                      <span className="text-yellow-400">DELIVERY_RETRY</span>
                      <span>- order 882: network timeout, scheduling retry in 30s</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500">[2025-09-03 11:13:32]</span>
                      <span className="text-blue-400">DELIVERY_RETRY</span>
                      <span>- retry 1/3 for order 882</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500">[2025-09-03 11:13:55]</span>
                      <span className="text-green-400">DELIVERY_SUCCESS</span>
                      <span>- license key delivered to customer@company.com</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Retry & Recovery Features</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Exponential backoff retry logic
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Idempotent delivery pipeline
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Automated failure recovery
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Manual retry capabilities
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
