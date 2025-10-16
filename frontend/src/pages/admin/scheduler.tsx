import Head from "next/head";
import { useState, useEffect } from "react";
import { FiSettings, FiPlay, FiPause, FiRefreshCw, FiClock, FiCheckCircle, FiAlertCircle, FiZap, FiCalendar, FiActivity } from "react-icons/fi";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from '@/contexts/AuthContext';
import { AdminService, SchedulerStatus } from '@/services/adminService';

interface SchedulerJob {
  id: string;
  name: string;
  next_run_time: string;
  trigger: string;
  func: string;
}

export default function AdminScheduler() {
  const { api } = useAuth();
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus>({
    isRunning: false,
    jobCount: 0
  });
  const [jobs, setJobs] = useState<SchedulerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncHour, setSyncHour] = useState(2);
  const [syncMinute, setSyncMinute] = useState(0);
  const [lastSyncResult, setLastSyncResult] = useState<string>('');

  useEffect(() => {
    fetchSchedulerData();
  }, []);

  const fetchSchedulerData = async () => {
    try {
      setLoading(true);
      const adminService = new AdminService(api);
      
      const [status, jobsList] = await Promise.all([
        adminService.getSchedulerStatus(),
        adminService.getSchedulerJobs()
      ]);

      setSchedulerStatus(status);
      setJobs(jobsList);
    } catch (error) {
      console.error('Failed to fetch scheduler data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      const adminService = new AdminService(api);
      const result = await adminService.triggerManualSync();
      setLastSyncResult(result.message);
      
      setTimeout(() => {
        fetchSchedulerData();
      }, 2000);
    } catch (error:any) {
      console.error('Failed to trigger manual sync:', error);
      setLastSyncResult(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateSchedule = async () => {
    try {
      const adminService = new AdminService(api);
      const result = await adminService.updateSyncSchedule(syncHour, syncMinute);
      setLastSyncResult(result.message);
      
      setTimeout(() => {
        fetchSchedulerData();
      }, 1000);
    } catch (error: any) {
      console.error('Failed to update schedule:', error);
      setLastSyncResult(`Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };


  return (
    <>
      <Head>
        <title>Sync Scheduler • Lootamo Admin</title>
      </Head>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header Section */}
          <div className="bg-blue-600 text-white px-2 py-4 rounded-xl">
            <div className="px-2 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Sync Scheduler</h1>
                  <p className="text-indigo-100 text-sm">
                    Automated product synchronization and scheduling management
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={fetchSchedulerData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-3 text-sm bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20"
                    style={{ cursor: "pointer" }}
                  >
                    <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button
                    onClick={handleManualSync}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-3 text-sm bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20"
                    style={{ cursor: "pointer" }}
                  >
                    <FiZap className={`text-lg ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Quick Sync'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-xl shadow-lg ${schedulerStatus.isRunning ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                  {schedulerStatus.isRunning ? (
                    <FiCheckCircle className="text-2xl text-white" />
                  ) : (
                    <FiAlertCircle className="text-2xl text-white" />
                  )}
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {schedulerStatus.isRunning ? 'Running' : 'Stopped'}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Scheduler Status</div>
                  <div className={`inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                    schedulerStatus.isRunning 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${schedulerStatus.isRunning ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    {schedulerStatus.isRunning ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <FiSettings className="text-2xl text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{schedulerStatus.jobCount}</div>
                  <div className="text-sm text-gray-600 font-medium">Active Jobs</div>
                  <div className="inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    <FiActivity className="text-xs" />
                    Monitoring
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <FiClock className="text-2xl text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {schedulerStatus.syncFrequency || 'Daily'}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Sync Frequency</div>
                  <div className="inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    <FiCalendar className="text-xs" />
                    Scheduled
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Sync Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <FiZap className="text-xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Manual Product Sync</h2>
                  <p className="text-gray-600">Trigger immediate synchronization with G2A API</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="text-xs font-medium text-gray-600 mb-2">Product Updates</div>
                      <div className="inline-flex items-center gap-2 text-blue-700 font-semibold">
                        <FiCheckCircle className="text-lg" /> Real-time
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                      <div className="text-xs font-medium text-gray-600 mb-2">Price Sync</div>
                      <div className="inline-flex items-center gap-2 text-emerald-700 font-semibold">
                        <FiCheckCircle className="text-lg" /> Automated
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <div className="text-xs font-medium text-gray-600 mb-2">Availability</div>
                      <div className="inline-flex items-center gap-2 text-purple-700 font-semibold">
                        <FiCheckCircle className="text-lg" /> Live Status
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  style={{ cursor: "pointer" }}
                  className={`px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 ${
                    syncing
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {syncing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Syncing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FiPlay className="text-lg" />
                      Start Sync
                    </div>
                  )}
                </button>
              </div>
              
              {lastSyncResult && (
                <div className={`mt-6 p-4 rounded-xl text-sm border ${
                  lastSyncResult.includes('Error') 
                    ? 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-red-200'
                    : 'bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-green-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {lastSyncResult.includes('Error') ? (
                      <FiAlertCircle className="text-lg flex-shrink-0" />
                    ) : (
                      <FiCheckCircle className="text-lg flex-shrink-0" />
                    )}
                    <span className="font-medium">{lastSyncResult}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                  <FiSettings className="text-xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Schedule Configuration</h2>
                  <p className="text-gray-600">Configure automated sync timing and frequency</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Daily Sync Time
                    </label>
                    <div className="flex gap-3 items-center">
                      <div className="relative">
                        <select
                          value={syncHour}
                          onChange={(e) => setSyncHour(parseInt(e.target.value))}
                          className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium text-gray-900 transition-all duration-200"
                          style={{ cursor: "pointer" }}
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {i.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <span className="text-2xl font-bold text-gray-400">:</span>
                      <div className="relative">
                        <select
                          value={syncMinute}
                          onChange={(e) => setSyncMinute(parseInt(e.target.value))}
                          className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium text-gray-900 transition-all duration-200"
                          style={{ cursor: "pointer" }}
                        >
                          {[0, 15, 30, 45].map((minute) => (
                            <option key={minute} value={minute}>
                              {minute.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="bg-gradient-to-br from-gray-100 to-gray-200 px-3 py-2 rounded-xl">
                        <span className="text-sm font-semibold text-gray-600">UTC</span>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                      <p className="text-sm font-medium text-indigo-700">
                        Current setting: {formatTime(syncHour, syncMinute)} UTC
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FiClock className="text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800">Sync Preview</span>
                      </div>
                      <div className="text-xs text-blue-700">
                        Next sync: {formatTime(syncHour, syncMinute)} UTC daily
                      </div>
                    </div>
                    <button
                      onClick={handleUpdateSchedule}
                      className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                      style={{ cursor: "pointer" }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <FiCheckCircle className="text-lg" />
                        Update Schedule
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg">
                    <FiActivity className="text-xl text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Sync Information</h2>
                    <p className="text-gray-600">Current synchronization status and timing</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2">
                      <FiClock className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Last Run</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {schedulerStatus.lastRun 
                        ? new Date(schedulerStatus.lastRun).toLocaleString()
                        : 'Never'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2">
                      <FiCalendar className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Next Run</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-900">
                      {schedulerStatus.nextRun 
                        ? new Date(schedulerStatus.nextRun).toLocaleString()
                        : 'Not scheduled'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-2">
                      <FiRefreshCw className="text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">Frequency</span>
                    </div>
                    <span className="text-sm font-semibold text-purple-900">
                      {schedulerStatus.syncFrequency || 'Daily at 02:00 UTC'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                    <FiSettings className="text-xl text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Active Jobs</h2>
                    <p className="text-gray-600">Currently scheduled background tasks</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                      <span className="ml-3 text-sm text-gray-500">Loading jobs...</span>
                    </div>
                  ) : jobs.length > 0 ? (
                    jobs.map((job) => (
                      <div key={job.id} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <div className="text-sm font-semibold text-gray-900">{job.name || job.func}</div>
                            </div>
                            <div className="text-xs text-gray-500 font-medium">ID: {job.id}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-600 font-medium mb-1">Next Run</div>
                            <div className="text-xs font-semibold text-gray-900">
                              {job.next_run_time 
                                ? new Date(job.next_run_time).toLocaleString()
                                : 'Not scheduled'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="p-3 bg-gray-100 rounded-full mb-3">
                        <FiSettings className="text-2xl text-gray-400" />
                      </div>
                      <div className="text-sm font-medium text-gray-500">No active jobs</div>
                      <div className="text-xs text-gray-400 mt-1">Jobs will appear here when scheduled</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg border border-blue-200">
            <div className="p-6 border-b border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <FiSettings className="text-xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Scheduler Help</h2>
                  <p className="text-blue-700">Understanding sync operations and scheduling</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-5 shadow-md border border-blue-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FiZap className="text-green-600" />
                    </div>
                    <h3 className="font-bold text-gray-900">Manual Sync</h3>
                  </div>
                  <ul className="text-gray-700 space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Immediately syncs products from G2A API</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Updates product availability and pricing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Marks discontinued products as inactive</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-md border border-blue-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FiClock className="text-indigo-600" />
                    </div>
                    <h3 className="font-bold text-gray-900">Scheduled Sync</h3>
                  </div>
                  <ul className="text-gray-700 space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <FiCheckCircle className="text-indigo-500 mt-0.5 flex-shrink-0" />
                      <span>Runs automatically at configured time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FiCheckCircle className="text-indigo-500 mt-0.5 flex-shrink-0" />
                      <span>Default: Daily at 02:00 UTC</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FiCheckCircle className="text-indigo-500 mt-0.5 flex-shrink-0" />
                      <span>Customizable to any hour and 15-minute intervals</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
