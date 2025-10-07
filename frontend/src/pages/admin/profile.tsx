import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { FiUser, FiMail, FiPhone, FiEdit2, FiLogOut, FiShield, FiBell, FiKey, FiSettings, FiActivity, FiCalendar, FiCheckCircle } from "react-icons/fi";
import { FaBuilding } from "react-icons/fa";

export default function AdminProfile() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
  }, [router]);

  const user = {
    name: "System Administrator",
    email: "admin@lootamo.com",
    phone: "+1 555 0100",
    company: "Lootamo Inc.",
    department: "Operations",
    memberSince: "2025-09-09",
  };

  return (
    <>
      <Head>
        <title>My Profile • Lootamo Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-100 flex">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col">
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-700 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white">My Profile</h1>
                    <p className="text-blue-100 text-sm">
                      Manage your account settings and monitor license activity
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-3 text-sm bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20">
                      <FiEdit2 className="text-lg" />
                      Edit Profile
                    </button>                 
                  </div>
                </div>
              </div>
            </div>

            <section className="space-y-6">

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-2xl shadow-lg">
                        <FiUser />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          <FiPhone className="text-xs" />
                          {user.phone}
                        </div>
                        <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <FiCalendar className="text-xs" />
                          Member since {user.memberSince}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium text-emerald-700 mb-1">Total Products</div>
                            <div className="text-2xl font-bold text-emerald-900">120</div>
                          </div>
                          <div className="p-2 bg-emerald-200 rounded-lg">
                            <FiActivity className="text-emerald-700" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium text-blue-700 mb-1">License Keys Delivered</div>
                            <div className="text-2xl font-bold text-blue-900">4,500</div>
                          </div>
                          <div className="p-2 bg-blue-200 rounded-lg">
                            <FiCheckCircle className="text-blue-700" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium text-amber-700 mb-1">Pending Keys</div>
                            <div className="text-2xl font-bold text-amber-900">25</div>
                          </div>
                          <div className="p-2 bg-amber-200 rounded-lg">
                            <FiKey className="text-amber-700" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                
                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg">
                        <FiUser className="text-xl text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Account Details</h3>
                        <p className="text-gray-600">Your personal and professional information</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Full Name</label>
                        <div className="p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 font-medium text-gray-900">
                          {user.name}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Email Address</label>
                        <div className="p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center gap-3">
                          <div className="p-2 bg-blue-200 rounded-lg">
                            <FiMail className="text-blue-700" />
                          </div>
                          <span className="font-medium text-blue-900">{user.email}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Company</label>
                        <div className="p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center gap-3">
                          <div className="p-2 bg-purple-200 rounded-lg">
                            <FaBuilding className="text-purple-700" />
                          </div>
                          <span className="font-medium text-purple-900">{user.company}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Department</label>
                        <div className="p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 font-medium text-gray-900">
                          {user.department}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Phone</label>
                        <div className="p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex items-center gap-3">
                          <div className="p-2 bg-green-200 rounded-lg">
                            <FiPhone className="text-green-700" />
                          </div>
                          <span className="font-medium text-green-900">{user.phone}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Member Since</label>
                        <div className="p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center gap-3">
                          <div className="p-2 bg-indigo-200 rounded-lg">
                            <FiCalendar className="text-indigo-700" />
                          </div>
                          <span className="font-medium text-indigo-900">{user.memberSince}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                      <FiKey className="text-xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Recent License Deliveries</h3>
                      <p className="text-gray-600">Track your software and game license distribution</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-6 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full mb-6">
                      <FiKey className="text-4xl text-orange-600" />
                    </div>
                    <div className="space-y-2 mb-6">
                      <div className="text-lg font-semibold text-gray-900">No licenses delivered yet</div>
                      <div className="text-sm text-gray-600 max-w-md">
                        Once you deliver a software or game license, it will appear here with detailed tracking information.
                      </div>
                    </div>
                    <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                      <div className="flex items-center gap-2">
                        <FiKey className="text-lg" />
                        Deliver First License
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                        <FiShield className="text-xl text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Security & Access</h3>
                        <p className="text-gray-600">Manage your account security settings</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">Password Security</div>
                            <div className="text-sm text-gray-600 mt-1">Last updated: recently</div>
                          </div>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            Change
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-emerald-900">Two-Factor Authentication</div>
                            <div className="text-sm text-emerald-700 mt-1">Enhance account security</div>
                          </div>
                          <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only" />
                            <span className="w-12 h-6 bg-gray-300 rounded-full relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-5 after:h-5 after:rounded-full transition-all hover:bg-emerald-400" />
                          </label>
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-blue-900">Session Management</div>
                            <div className="text-sm text-blue-700 mt-1">Recent devices and activity</div>
                          </div>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            Review
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-red-900">Logout from all devices</div>
                          <button className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                            <FiLogOut />
                            Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                        <FiBell className="text-xl text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Notifications</h3>
                        <p className="text-gray-600">Configure your notification preferences</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-emerald-900">License Deliveries</div>
                            <div className="text-sm text-emerald-700 mt-1">Notify when licenses are delivered</div>
                          </div>
                          <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only" defaultChecked />
                            <span className="w-12 h-6 bg-emerald-400 rounded-full relative after:content-[''] after:absolute after:top-0.5 after:left-6 after:bg-white after:w-5 after:h-5 after:rounded-full transition-all" />
                          </label>
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">System Alerts</div>
                            <div className="text-sm text-gray-600 mt-1">Maintenance and updates</div>
                          </div>
                          <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only" />
                            <span className="w-12 h-6 bg-gray-300 rounded-full relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-5 after:h-5 after:rounded-full transition-all" />
                          </label>
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-900">Promotions & DLC</div>
                            <div className="text-sm text-gray-600 mt-1">New games, updates, and DLCs</div>
                          </div>
                          <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only" />
                            <span className="w-12 h-6 bg-gray-300 rounded-full relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-5 after:h-5 after:rounded-full transition-all" />
                          </label>
                        </div>
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
