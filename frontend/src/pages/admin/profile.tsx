import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { FiUser, FiMail, FiPhone, FiEdit2, FiLogOut, FiShield, FiBell, FiKey } from "react-icons/fi";
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

          <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

            <section className="space-y-4">
              
              <div className="flex items-center gap-2 text-gray-900">
                <span className="text-blue-600"><FiUser /></span>
                <h2 className="font-semibold">User Profile</h2>
              </div>
              <p className="text-sm text-gray-600">Manage your account and monitor software/game license activity.</p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="bg-white rounded-xl shadow p-5 border">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl">
                      <FiUser />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.phone} • Member since {user.memberSince}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-5 text-center">
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-gray-500">Total Products</div>
                      <div className="text-lg font-semibold">120</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-gray-500">License Keys Delivered</div>
                      <div className="text-lg font-semibold">4,500</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-gray-500">Pending Keys</div>
                      <div className="text-lg font-semibold">25</div>
                    </div>
                  </div>
                </div>

                
                <div className="lg:col-span-2 bg-white rounded-xl shadow p-5 border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Account Details</h3>
                    <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded border text-sm hover:bg-gray-50"><FiEdit2 /> Edit Profile</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="text-xs text-gray-500">Full Name</label>
                      <div className="mt-1 border rounded-lg px-3 py-2 text-sm bg-gray-50">{user.name}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Email Address</label>
                      <div className="mt-1 border rounded-lg px-3 py-2 text-sm bg-gray-50 inline-flex items-center gap-2"><FiMail className="text-gray-500" /> {user.email}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Company</label>
                      <div className="mt-1 border rounded-lg px-3 py-2 text-sm bg-gray-50 inline-flex items-center gap-2"><FaBuilding className="text-gray-500" /> {user.company}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Department</label>
                      <div className="mt-1 border rounded-lg px-3 py-2 text-sm bg-gray-50">{user.department}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Phone</label>
                      <div className="mt-1 border rounded-lg px-3 py-2 text-sm bg-gray-50 inline-flex items-center gap-2"><FiPhone className="text-gray-500" /> {user.phone}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Member Since</label>
                      <div className="mt-1 border rounded-lg px-3 py-2 text-sm bg-gray-50">{user.memberSince}</div>
                    </div>
                  </div>
                </div>
              </div>

              
              <div className="bg-white rounded-xl shadow p-5 border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Recent License Deliveries</h3>
                </div>
                <div className="mt-6 flex flex-col items-center justify-center text-gray-500">
                  <div className="text-5xl"><FiKey /></div>
                  <div className="mt-2 text-sm">No licenses delivered yet</div>
                  <div className="text-xs">Once you deliver a software/game license, it will appear here.</div>
                  <button className="mt-4 px-4 py-2 rounded bg-slate-900 text-white text-sm hover:bg-slate-800">Deliver First License</button>
                </div>
              </div>

              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow p-5 border">
                  <div className="flex items-center gap-2">
                    <FiShield />
                    <h3 className="font-semibold">Security & Access</h3>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Password Security</div>
                        <div className="text-xs text-gray-500">Last updated: recently</div>
                      </div>
                      <button className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50">Change</button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Two-Factor Authentication</div>
                        <div className="text-xs text-gray-500">Enhance account security</div>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only" />
                        <span className="w-10 h-5 bg-gray-200 rounded-full relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-4 after:h-4 after:rounded-full transition-all" />
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Session Management</div>
                        <div className="text-xs text-gray-500">Recent devices</div>
                      </div>
                      <button className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50">Review</button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-red-600">Sign out</div>
                      <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded border text-sm hover:bg-gray-50"><FiLogOut /> Sign Out</button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow p-5 border">
                  <div className="flex items-center gap-2">
                    <FiBell />
                    <h3 className="font-semibold">Notifications</h3>
                  </div>

                  <div className="mt-4 space-y-4 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">License Deliveries</div>
                        <div className="text-xs text-gray-500">Notify when licenses are delivered</div>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only" defaultChecked />
                        <span className="w-10 h-5 bg-emerald-200 rounded-full relative after:content-[''] after:absolute after:top-0.5 after:left-5 after:bg-white after:w-4 after:h-4 after:rounded-full transition-all" />
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">System Alerts</div>
                        <div className="text-xs text-gray-500">Maintenance and updates</div>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only" />
                        <span className="w-10 h-5 bg-gray-200 rounded-full relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-4 after:h-4 after:rounded-full transition-all" />
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Promotions & DLC</div>
                        <div className="text-xs text-gray-500">Notify about new games, updates, or DLCs</div>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only" />
                        <span className="w-10 h-5 bg-gray-200 rounded-full relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:w-4 after:h-4 after:rounded-full transition-all" />
                      </label>
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
