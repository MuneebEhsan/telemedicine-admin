"use client";

import { useEffect, useState } from "react";
import { Activity, Search, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";

const riskConfig: Record<string, { label: string; className: string; icon: any }> = {
  low: { label: "Low Risk", className: "bg-green-50 text-green-800 border-green-200", icon: CheckCircle },
  moderate: { label: "Moderate Risk", className: "bg-amber-50 text-amber-800 border-amber-200", icon: AlertTriangle },
  high: { label: "High Risk", className: "bg-red-50 text-red-800 border-red-200", icon: AlertTriangle },
};

export default function SelfTestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [riskFilter, setRiskFilter] = useState("");
  const limit = 20;

  const load = async () => {
    try {
      setLoading(true);
      let query = `page=${page}&limit=${limit}`;
      if (riskFilter) query += `&riskLevel=${riskFilter}`;
      const data = await adminApi.getAllSelfTests(query);
      if (data.success) {
        setTests(data.data);
        setTotal(data.pagination?.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, riskFilter]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <>
      <Header title="Self-Test Results" />

      <div className="p-8 max-w-7xl mx-auto animate-fade-in">
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Toolbar */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-3 flex-wrap">
              <select
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none"
                value={riskFilter}
                onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="moderate">Moderate Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>
            <span className="text-sm text-slate-500">{total} total results</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Concern</th>
                  <th className="px-6 py-4">For Whom</th>
                  <th className="px-6 py-4">Risk Level</th>
                  <th className="px-6 py-4">Summary</th>
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
                        Loading results...
                      </div>
                    </td>
                  </tr>
                ) : tests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">No self-test results found.</td>
                  </tr>
                ) : (
                  tests.map((test: any) => {
                    const risk = test.aiResponse?.riskLevel || "low";
                    const cfg = riskConfig[risk] || riskConfig.low;
                    const RiskIcon = cfg.icon;
                    return (
                      <tr key={test._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          {test.user ? (
                            <>
                              <p className="font-medium text-[#0B132B]">{test.user.name}</p>
                              <p className="text-xs text-slate-400">{test.user.phone}</p>
                            </>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Guest / Anonymous</span>
                          )}
                        </td>
                        <td className="px-6 py-4 capitalize">{test.answers?.concern || "—"}</td>
                        <td className="px-6 py-4 capitalize">{test.answers?.forWhom || "—"}</td>
                        <td className="px-6 py-4">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", cfg.className)}>
                            <RiskIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-sm text-slate-500 line-clamp-2">{test.aiResponse?.summary || "—"}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{formatDate(test.createdAt)}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Link
                            href={`/self-tests/${test._id}`}
                            className="inline-flex items-center text-xs font-medium text-[#14B8A6] bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 px-3 py-1.5 rounded-lg transition-all"
                          >
                            Full Report
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
