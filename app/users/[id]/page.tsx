"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Shield, Ban, CheckCircle, Trash2, User,
  ShoppingBag, Video, Activity, FileText, Clock
} from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { formatDate, formatPrice, cn } from "@/lib/utils";
import Link from "next/link";

const TABS = [
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "prescriptions", label: "Prescription Orders", icon: FileText },
  { id: "consultations", label: "Consultations", icon: Video },
  { id: "selftests", label: "Self Tests", icon: Activity },
];

const riskColors: Record<string, string> = {
  low: "bg-green-100 text-green-800 border-green-200",
  moderate: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-red-100 text-red-800 border-red-200",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  packed: "bg-purple-100 text-purple-800",
  dispatched: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  booked: "bg-blue-100 text-blue-800",
  in_progress: "bg-teal-100 text-teal-800",
  completed: "bg-green-100 text-green-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  pending_review: "bg-yellow-100 text-yellow-800",
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await adminApi.getUserDetails(id);
        if (res.success) setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const toggleBan = async () => {
    if (!data?.user) return;
    const isBanned = data.user.status === "banned";
    if (isBanned) {
      await adminApi.unbanUser(id);
    } else {
      const reason = prompt("Enter ban reason:") || "Violation of terms";
      await adminApi.banUser(id, reason);
    }
    const res = await adminApi.getUserDetails(id);
    if (res.success) setData(res.data);
  };

  const handleDelete = async () => {
    if (!confirm(`Permanently delete user "${data?.user?.name}"? This cannot be undone.`)) return;
    await adminApi.deleteUser(id);
    router.push("/users");
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">User not found.</div>
    );
  }

  const { user, orders = [], consultations = [], selfTests = [], prescriptionOrders = [] } = data;

  return (
    <>
      <Header title="User Details" />

      <div className="p-8 max-w-7xl mx-auto animate-fade-in space-y-6">
        {/* Back */}
        <Link href="/users" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#0F3C3A] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </Link>

        {/* Profile Card */}
        <div className="glass-panel rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#14B8A6]/30 to-[#0F3C3A]/20 flex items-center justify-center text-2xl font-bold text-[#0B132B]">
                {user.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-display font-bold text-[#0B132B]">{user.name}</h2>
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold capitalize",
                    user.role === "admin" ? "bg-purple-100 text-purple-800" :
                    user.role === "doctor" ? "bg-blue-100 text-blue-800" :
                    "bg-slate-100 text-slate-700")}>
                    {user.role === "admin" && <Shield className="w-3 h-3 inline mr-1" />}
                    {user.role}
                  </span>
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold capitalize",
                    user.status === "active" ? "bg-green-100 text-green-800" :
                    user.status === "banned" ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800")}>
                    {user.status}
                  </span>
                </div>
                <p className="text-slate-600 text-sm">{user.phone}</p>
                {user.email && <p className="text-slate-400 text-sm">{user.email}</p>}
                <p className="text-slate-400 text-xs mt-1">Joined {formatDate(user.createdAt)}</p>
              </div>
            </div>

            {/* Actions */}
            {user.role !== "admin" && (
              <div className="flex gap-2">
                <button
                  onClick={toggleBan}
                  className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                    user.status === "banned"
                      ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                      : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  )}
                >
                  {user.status === "banned" ? <><CheckCircle className="w-4 h-4" /> Unban</> : <><Ban className="w-4 h-4" /> Ban</>}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 text-center">
              <p className="text-2xl font-bold text-[#0B132B]">{orders.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Orders</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 text-center">
              <p className="text-2xl font-bold text-[#0B132B]">{consultations.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Consultations</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 text-center">
              <p className="text-2xl font-bold text-[#0B132B]">{selfTests.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Self Tests</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 text-center">
              <p className="text-2xl font-bold text-[#0B132B]">{prescriptionOrders.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Rx Orders</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="border-b border-slate-100 flex overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-[#14B8A6] text-[#0F3C3A]"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Orders Tab */}
            {activeTab === "orders" && (
              orders.length === 0 ? (
                <EmptyState icon={ShoppingBag} text="No orders yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3">Order #</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Payment</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((o: any) => (
                        <tr key={o._id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-[#0B132B]">{o.orderNumber}</td>
                          <td className="px-4 py-3">
                            <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize", statusColors[o.orderStatus] || "bg-slate-100 text-slate-700")}>
                              {o.orderStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("text-xs font-bold uppercase", o.paymentStatus === "paid" ? "text-green-600" : "text-amber-600")}>
                              {o.paymentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{formatPrice(o.totalAmount)}</td>
                          <td className="px-4 py-3 text-slate-400">{formatDate(o.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <Link href={`/orders/${o._id}`} className="text-xs text-[#14B8A6] hover:underline">View</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Prescription Orders Tab */}
            {activeTab === "prescriptions" && (
              prescriptionOrders.length === 0 ? (
                <EmptyState icon={FileText} text="No prescription orders yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3">Order #</th>
                        <th className="px-4 py-3">Rx Status</th>
                        <th className="px-4 py-3">Order Status</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prescriptionOrders.map((o: any) => (
                        <tr key={o._id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-[#0B132B]">{o.orderNumber}</td>
                          <td className="px-4 py-3">
                            <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize", statusColors[o.prescriptionStatus] || "bg-slate-100 text-slate-700")}>
                              {o.prescriptionStatus?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize", statusColors[o.orderStatus] || "bg-slate-100 text-slate-700")}>
                              {o.orderStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{formatPrice(o.totalAmount)}</td>
                          <td className="px-4 py-3 text-slate-400">{formatDate(o.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Consultations Tab */}
            {activeTab === "consultations" && (
              consultations.length === 0 ? (
                <EmptyState icon={Video} text="No consultations yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3">Appointment #</th>
                        <th className="px-4 py-3">Doctor</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {consultations.map((c: any) => (
                        <tr key={c._id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-[#0B132B]">{c.appointmentNumber}</td>
                          <td className="px-4 py-3">{c.doctor?.doctorProfile?.professionalName || c.doctor?.name || "—"}</td>
                          <td className="px-4 py-3 capitalize">{c.callType || "chat"}</td>
                          <td className="px-4 py-3">
                            <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize", statusColors[c.status] || "bg-slate-100 text-slate-700")}>
                              {c.status?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400">{formatDate(c.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <Link href={`/consultations/${c._id}`} className="text-xs text-[#14B8A6] hover:underline">View</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Self Tests Tab */}
            {activeTab === "selftests" && (
              selfTests.length === 0 ? (
                <EmptyState icon={Activity} text="No self-test results yet." />
              ) : (
                <div className="space-y-3">
                  {selfTests.map((test: any) => (
                    <div key={test._id} className="border border-slate-200 rounded-lg p-4 hover:border-[#14B8A6]/40 transition-colors">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-[#0B132B] capitalize">{test.answers?.concern || "General"}</span>
                            {test.aiResponse?.riskLevel && (
                              <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold uppercase border", riskColors[test.aiResponse.riskLevel] || "bg-slate-100 text-slate-700")}>
                                {test.aiResponse.riskLevel} risk
                              </span>
                            )}
                          </div>
                          {test.aiResponse?.summary && (
                            <p className="text-sm text-slate-500 line-clamp-2">{test.aiResponse.summary}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{formatDate(test.createdAt)}
                          </span>
                          <Link href={`/self-tests/${test._id}`} className="text-xs text-[#14B8A6] hover:underline font-medium">
                            View Full
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
      <Icon className="w-10 h-10 text-slate-300" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
