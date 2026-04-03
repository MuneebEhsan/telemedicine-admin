"use client";

import { useEffect, useState } from "react";
import { Users, ShoppingBag, ClipboardList, TrendingUp, AlertTriangle } from "lucide-react";
import Header from "@/components/layout/Header";
import StatCard from "@/components/ui/StatCard";
import { adminApi } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/utils";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await adminApi.getAdminDashboard();
        if (data.success) {
          setStats(data.data.stats);
          setRecentOrders(data.data.recentOrders);
        }
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Header title="Dashboard Overview" />
      
      <div className="p-8 max-w-7xl mx-auto animate-fade-in">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Revenue"
              value={stats.totalRevenue || 0}
              icon={TrendingUp}
              isCurrency={true}
              trend="up"
              trendValue="12.5%"
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders || 0}
              icon={ClipboardList}
              trend="up"
              trendValue="5.2%"
            />
            <StatCard
              title="Total Users"
              value={stats.totalUsers || 0}
              icon={Users}
              trend="neutral"
              trendValue="0.0%"
            />
            <StatCard
              title="Low Stock Items"
              value={stats.lowStockProducts || 0}
              icon={AlertTriangle}
              trend="down"
              trendValue="2 items"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-display font-semibold text-[#0B132B]">Recent Orders</h2>
              <button className="text-sm font-medium text-[#14B8A6] hover:text-[#0F3C3A] transition-colors">View All</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No recent orders found.</td>
                    </tr>
                  ) : (
                    recentOrders.map((order: any) => (
                      <tr key={order.orderNumber || Math.random()} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-[#0B132B]">{order.orderNumber}</td>
                        <td className="px-6 py-4">{order.user?.name || "Unknown"}</td>
                        <td className="px-6 py-4">{formatPrice(order.totalAmount)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                            ${order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              order.orderStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                              'bg-slate-100 text-slate-800'}`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="glass-panel rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-display font-semibold text-[#0B132B] mb-4">Quick Insights</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                  <span className="text-sm font-medium text-blue-900">Today's Orders</span>
                  <span className="text-lg font-bold text-blue-700">{stats?.todaysOrders || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-amber-50/50 rounded-lg border border-amber-100">
                  <span className="text-sm font-medium text-amber-900">Pending Approvals</span>
                  <span className="text-lg font-bold text-amber-700">{stats?.pendingOrders || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
