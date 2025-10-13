import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { useAuth } from '@/contexts/AuthContext';
import { AdminService, RetryLog, RetryStats, ErrorLog, ErrorStats } from '@/services/adminService';
import { 
  FiDatabase, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiServer,
  FiShield,
  FiEye,
} from "react-icons/fi";

export default function AdminLogs() {
  const router = useRouter();
  const { api } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [retryLogs, setRetryLogs] = useState<RetryLog[]>([]);
  const [retryStats, setRetryStats] = useState<RetryStats | null>(null);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllRetryLogs, setShowAllRetryLogs] = useState(false);
  const [showAllErrorLogs, setShowAllErrorLogs] = useState(false);
  const [deletingRetryLog, setDeletingRetryLog] = useState<number | null>(null);
  const [deletingErrorLog, setDeletingErrorLog] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{type: 'retry' | 'error', id: number} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!api) return;
      
      try {
        setLoading(true);
        const adminService = new AdminService(api);
        
        const [logsResponse, errorLogsResponse] = await Promise.all([
          adminService.getRetryLogs(0, 50),
          adminService.getErrorLogs(1, 10)
        ]);
        
        // Calculate stats from the fetched logs to avoid duplicate API call
        const statsResponse = adminService.calculateRetryStatsFromLogs(logsResponse.retry_logs);
        const errorStatsResponse = await adminService.getErrorStats();
        
        setRetryLogs(logsResponse.retry_logs);
        setRetryStats(statsResponse);
        setErrorLogs(errorLogsResponse.error_logs);
        setErrorStats(errorStatsResponse);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch retry logs:', err);
        setError('Failed to load retry logs data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [api, router]);

  const confirmDelete = (type: 'retry' | 'error', id: number) => {
    setShowDeleteConfirm({ type, id });
  };

  const handleDeleteRetryLog = async (retryLogId: number) => {
    if (!api) return;
    
    try {
      setDeletingRetryLog(retryLogId);
      const adminService = new AdminService(api);
      await adminService.deleteRetryLog(retryLogId);
      
      // Remove the deleted log from the state
      setRetryLogs(prev => prev.filter(log => log.id !== retryLogId));
      
      // Refresh stats to reflect the deletion
      const updatedLogs = retryLogs.filter(log => log.id !== retryLogId);
      const statsResponse = adminService.calculateRetryStatsFromLogs(updatedLogs);
      setRetryStats(statsResponse);
      
    } catch (error) {
      console.error('Failed to delete retry log:', error);
      setError('Failed to delete retry log');
    } finally {
      setDeletingRetryLog(null);
      setShowDeleteConfirm(null);
    }
  };

  const handleDeleteErrorLog = async (errorLogId: number) => {
    if (!api) return;
    
    try {
      setDeletingErrorLog(errorLogId);
      const adminService = new AdminService(api);
      await adminService.deleteErrorLog(errorLogId);
      
      // Remove the deleted log from the state
      setErrorLogs(prev => prev.filter(log => log.id !== errorLogId));
      
      // Refresh stats to reflect the deletion
      const statsResponse = await adminService.getErrorStats();
      setErrorStats(statsResponse);
      
    } catch (error) {
      console.error('Failed to delete error log:', error);
      setError('Failed to delete error log');
    } finally {
      setDeletingErrorLog(null);
      setShowDeleteConfirm(null);
    }
  };

  const executeDelete = () => {
    if (!showDeleteConfirm) return;
    
    if (showDeleteConfirm.type === 'retry') {
      handleDeleteRetryLog(showDeleteConfirm.id);
    } else {
      handleDeleteErrorLog(showDeleteConfirm.id);
    }
  };
    
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
        <div className="flex-1 flex flex-col md:ml-72">
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
                <h2 className="text-2xl font-bold text-gray-900">Retry Logic & Monitoring</h2>
                <p className="text-gray-600 mt-1">
                  Real-time monitoring of retry operations, email deliveries, and system recovery processes
                </p>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading retry statistics...</span>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Retries - Blue Theme */}
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-6 border border-blue-200 hover:from-blue-200 hover:to-blue-300 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-700 text-sm font-medium">Total Retries</p>
                        <p className="text-3xl font-bold mt-2 text-gray-900">{retryStats?.totalRetries || 0}</p>
                      </div>
                      <div className="p-3 bg-blue-500 rounded-lg">
                        <FiDatabase className="text-2xl text-white" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Failed Retries - Orange Theme */}
                  <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl p-6 border border-orange-200 hover:from-orange-200 hover:to-orange-300 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-700 text-sm font-medium">Failed Retries</p>
                        <p className="text-3xl font-bold mt-2 text-gray-900">{retryStats?.failedRetries || 0}</p>
                      </div>
                      <div className="p-3 bg-orange-500 rounded-lg">
                        <FiShield className="text-2xl text-white" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Successful Retries - Green Theme */}
                  <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-6 border border-green-200 hover:from-green-200 hover:to-green-300 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-700 text-sm font-medium">Successful Retries</p>
                        <p className="text-3xl font-bold mt-2 text-gray-900">{retryStats?.successfulRetries || 0}</p>
                      </div>
                      <div className="p-3 bg-green-500 rounded-lg">
                        <FiCheckCircle className="text-2xl text-white" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Pending Retries - Purple Theme */}
                  <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-6 border border-purple-200 hover:from-purple-200 hover:to-purple-300 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-700 text-sm font-medium">Pending Retries</p>
                        <p className="text-3xl font-bold mt-2 text-gray-900">{retryStats?.pendingRetries || 0}</p>
                      </div>
                      <div className="p-3 bg-purple-500 rounded-lg">
                        <FiServer className="text-2xl text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                {errorLogs.length > 3 && (
                  <div className="flex justify-end px-6 py-2">
                    <button 
                      onClick={() => setShowAllErrorLogs(!showAllErrorLogs)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      {showAllErrorLogs ? 'Show less' : 'View all'}
                    </button>
                  </div>
                )}
                <div className={`p-6 ${errorLogs.length > 3 ? 'pt-0' : ''}`}>
                  <div className="bg-gray-900 rounded-lg p-4 mb-4 font-mono text-xs text-green-400 space-y-1 overflow-x-auto">
                    {loading ? (
                      <div className="text-center py-4">
                        <span className="text-gray-400">Loading error logs...</span>
                      </div>
                    ) : errorLogs.length > 0 ? (
                      errorLogs.slice(0, showAllErrorLogs ? errorLogs.length : 3).map((log) => (
                        <div key={log.id} className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <span className={`${
                              log.severity === 'critical' ? 'text-red-400' : 
                              log.severity === 'error' ? 'text-orange-400' : 
                              'text-yellow-400'
                            }`}>
                              {log.display_message}
                            </span>
                          </div>
                          <button
                            onClick={() => confirmDelete('error', log.id)}
                            disabled={deletingErrorLog === log.id}
                            className={`ml-2 flex-shrink-0 transition-colors ${
                              deletingErrorLog === log.id 
                                ? 'text-gray-500 cursor-not-allowed' 
                                : 'text-red-400 hover:text-red-300'
                            }`}
                            title="Delete error log"
                          >
                            {deletingErrorLog === log.id ? '...' : '×'}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <span className="text-gray-400">No error logs available</span>
                      </div>
                    )}
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
                {retryLogs.length > 3 && (
                  <div className="flex justify-end px-6 py-2">
                    <button 
                      onClick={() => setShowAllRetryLogs(!showAllRetryLogs)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      {showAllRetryLogs ? 'Show less' : 'View all'}
                    </button>
                  </div>
                )}
                <div className={`p-6 ${retryLogs.length > 3 ? 'pt-0' : ''}`}>
                  <div className="bg-gray-900 rounded-lg p-4 mb-4 font-mono text-xs text-green-400 space-y-1 overflow-x-auto">
                    {loading ? (
                      <div className="text-center py-4">
                        <span className="text-gray-400">Loading retry logs...</span>
                      </div>
                    ) : retryLogs.length > 0 ? (
                      retryLogs.slice(0, showAllRetryLogs ? retryLogs.length : 3).map((log) => (
                        <div key={log.id} className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="text-gray-500">[{new Date(log.started_at + 'Z').toLocaleString('en-US', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit', 
                              second: '2-digit', 
                              hour12: false,
                              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                            })}]</span>
                            <span className={`${
                              log.status === 'success' ? 'text-green-400' : 
                              log.status === 'failed' ? 'text-red-400' : 
                              'text-yellow-400'
                            }`}>
                              {log.retry_type.toUpperCase()}
                            </span>
                            <span>
                              - attempt {log.attempt_number}/{log.max_attempts}: {log.status}
                              {log.error_message && ` - ${log.error_message}`}
                              {log.order_id && ` (order: ${log.order_id})`}
                            </span>
                          </div>
                          <button
                            onClick={() => confirmDelete('retry', log.id)}
                            disabled={deletingRetryLog === log.id}
                            className={`ml-2 flex-shrink-0 transition-colors ${
                              deletingRetryLog === log.id 
                                ? 'text-gray-500 cursor-not-allowed' 
                                : 'text-red-400 hover:text-red-300'
                            }`}
                            title="Delete retry log"
                          >
                            {deletingRetryLog === log.id ? '...' : '×'}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <span className="text-gray-400">No retry logs available</span>
                      </div>
                    )}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this {showDeleteConfirm.type} log? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
