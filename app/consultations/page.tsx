"use client";

import { useEffect, useState } from "react";
import { Search, Video, Phone, MessageSquare, Clock, CheckCircle, XCircle, Activity } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "booked", label: "Booked" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
  booked: { label: "Booked", className: "bg-blue-50 text-blue-800 border-blue-200", icon: Clock },
  in_progress: { label: "In Progress", className: "bg-teal-50 text-teal-800 border-teal-200", icon: Activity },
  completed: { label: "Completed", className: "bg-green-50 text-green-800 border-green-200", icon: CheckCircle },
  cancelled: { label: "Cancelled", className: "bg-red-50 text-red-800 border-red-200", icon: XCircle },
};

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = async () => {
    try {
      setLoading(true);
      let query = `page=${page}&limit=${limit}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) query += `&status=${statusFilter}`;
      const data = await adminApi.getAllConsultations(query);
      if (data.success) {
        setConsultations(data.data);
        setTotal(data.pagination?.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, search, statusFilter]);

  const totalPages = Math.ceil(total / limit) || 1;

  const getCallIcon = (callType: string) => {
    if (callType === "video") return <Video className="w-3.5 h-3.5 text-blue-500" />;
    if (callType === "audio") return <Phone className="w-3.5 h-3.5 text-green-500" />;
    return <MessageSquare className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <>
      <Header title="Consultation Management" />

      <div className="p-8 max-w-7xl mx-auto animate-fade-in">
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Toolbar */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-3 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search appointment #..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <select
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <span className="text-sm text-slate-500">{total} total consultations</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Appointment</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#14B8A6] border-t-transparent rounded-full animate-spin" />
                        Loading consultations...
                      </div>
                    </td>
                  </tr>
                ) : consultations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">No consultations found.</td>
                  </tr>
                ) : (
                  consultations.map((c: any) => {
                    const cfg = statusConfig[c.status] || { label: c.status, className: "bg-slate-100 text-slate-700 border-slate-200", icon: Clock };
                    const StatusIcon = cfg.icon;
                    return (
                      <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-[#0B132B]">{c.appointmentNumber}</p>
                          <p className="text-xs text-slate-400">{c.timeSlot}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium">{c.patient?.name || "—"}</p>
                          <p className="text-xs text-slate-400">{c.patient?.phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium">{c.doctor?.doctorProfile?.professionalName || c.doctor?.name || "—"}</p>
                          <p className="text-xs text-slate-400">{c.doctor?.doctorProfile?.specialization}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {getCallIcon(c.callType)}
                            <span className="capitalize text-xs text-slate-600">{c.callType || "Chat"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border capitalize", cfg.className)}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/consultations/${c._id}`}
                            className="text-xs font-medium text-[#14B8A6] bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
            <div className="space-x-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white hover:bg-slate-50 disabled:opacity-50">Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white hover:bg-slate-50 disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
