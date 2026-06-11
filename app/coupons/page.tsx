"use client";


import { useToast } from "@/lib/toast-context";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Eye, Ticket, X, Search, ToggleLeft, ToggleRight } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";

interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  maxDiscount: number;
  minOrderAmount: number;
  applicableTo: string[];
  usageLimit: number;
  perUserLimit: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdBy?: { name: string };
  usageHistory?: any[];
  createdAt: string;
}

const emptyForm = {
  code: "", description: "", discountType: "percentage" as "percentage" | "flat", discountValue: 0,
  maxDiscount: 0, minOrderAmount: 0, applicableTo: ["orders"] as string[],
  usageLimit: 0, perUserLimit: 1, validFrom: "", validTo: "", isActive: true,
};

export default function CouponsPage() {
  const { showSuccess, showError, showWarning } = useToast();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Coupon | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      let query = "";
      if (dateFrom) query += `dateFrom=${dateFrom}&`;
      if (dateTo) query += `dateTo=${dateTo}`;
      const data = await adminApi.getCoupons(query);
      setCoupons(data.data?.coupons || data.data || []);
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [dateFrom, dateTo]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (c: Coupon) => {
    setForm({
      code: c.code, description: c.description, discountType: c.discountType,
      discountValue: c.discountValue, maxDiscount: c.maxDiscount, minOrderAmount: c.minOrderAmount,
      applicableTo: c.applicableTo, usageLimit: c.usageLimit, perUserLimit: c.perUserLimit,
      validFrom: c.validFrom?.split("T")[0] || "", validTo: c.validTo?.split("T")[0] || "",
      isActive: c.isActive,
    });
    setEditingId(c._id); setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editingId) { await adminApi.updateCoupon(editingId, form); }
      else { await adminApi.createCoupon(form); }
      setShowModal(false); load();
    } catch (e: any) { showError(getErrorMessage(e)); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try { await adminApi.deleteCoupon(id); load(); } catch (e: any) { showError(getErrorMessage(e)); }
  };

  const handleToggle = async (c: Coupon) => {
    try { await adminApi.updateCoupon(c._id, { isActive: !c.isActive }); load(); } catch (e: any) { showError(getErrorMessage(e)); }
  };

  const viewDetail = async (id: string) => {
    try {
      const data = await adminApi.getCouponById(id);
      setShowDetail(data.data?.coupon || data.data);
    } catch (e: any) { showError(getErrorMessage(e)); }
  };

  const toggleApplicable = (val: string) => {
    setForm(prev => ({
      ...prev,
      applicableTo: prev.applicableTo.includes(val)
        ? prev.applicableTo.filter(v => v !== val)
        : [...prev.applicableTo, val],
    }));
  };

  const filtered = coupons.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const isExpired = (d: string) => new Date(d) < new Date();
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <>
      <Header title="Discount Coupons" />
      <div className="p-8 max-w-7xl mx-auto animate-fade-in">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search coupons..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20" />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="text-slate-400 text-sm">to</span>
            <input
              type="date"
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading coupons...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Ticket className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No coupons found. Create your first one!</p>
          </div>
        ) : (
          <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-100">
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Code</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Discount</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Applies To</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Usage</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Validity</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-right px-5 py-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(c => (
                  <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-[#0F3C3A] bg-[#14B8A6]/10 px-2 py-1 rounded">{c.code}</span>
                      {c.description && <p className="text-xs text-slate-400 mt-1 truncate max-w-[180px]">{c.description}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-semibold text-[#0B132B]">
                        {c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`}
                      </span>
                      {c.discountType === "percentage" && c.maxDiscount > 0 && (
                        <span className="text-xs text-slate-400 ml-1">(max ₹{c.maxDiscount})</span>
                      )}
                      {c.minOrderAmount > 0 && <p className="text-xs text-slate-400">Min ₹{c.minOrderAmount}</p>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.applicableTo.map(a => (
                          <span key={a} className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{a}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-medium">{c.usedCount}</span>
                      <span className="text-slate-400">/{c.usageLimit || "∞"}</span>
                      <p className="text-xs text-slate-400">{c.perUserLimit}/user</p>
                    </td>
                    <td className="px-5 py-3 text-xs">
                      <p>{fmtDate(c.validFrom)}</p>
                      <p className="text-slate-400">to {fmtDate(c.validTo)}</p>
                    </td>
                    <td className="px-5 py-3">
                      {!c.isActive ? (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-500">Inactive</span>
                      ) : isExpired(c.validTo) ? (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-50 text-red-500">Expired</span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">Active</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => viewDetail(c._id)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggle(c)} className="p-1.5 rounded-lg hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition-colors" title="Toggle">
                          {c.isActive ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-display font-semibold text-[#0B132B]">{editingId ? "Edit Coupon" : "Create Coupon"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Coupon Code *</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SAVE20"
                  disabled={!!editingId} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm uppercase font-mono disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Discount Type *</label>
                  <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Discount Value *</label>
                  <input type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Discount (₹)</label>
                  <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: Number(e.target.value) })}
                    placeholder="0 = no cap" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min Order Amount (₹)</label>
                  <input type="number" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Applicable To *</label>
                <div className="flex gap-3">
                  {["orders", "prescriptions", "appointments"].map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.applicableTo.includes(opt)} onChange={() => toggleApplicable(opt)}
                        className="rounded border-slate-300 text-[#14B8A6] focus:ring-[#14B8A6]" />
                      <span className="text-sm capitalize">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Usage Limit</label>
                  <input type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })}
                    placeholder="0 = unlimited" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Per User Limit</label>
                  <input type="number" value={form.perUserLimit} onChange={e => setForm({ ...form, perUserLimit: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valid From *</label>
                  <input type="date" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valid To *</label>
                  <input type="date" value={form.validTo} onChange={e => setForm({ ...form, validTo: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#14B8A6]"></div>
                </label>
                <span className="text-sm font-medium text-slate-700">Active</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.code || !form.validFrom || !form.validTo}
                className="btn-primary px-6 py-2 text-sm font-medium rounded-lg disabled:opacity-50">
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail/Usage Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-display font-semibold text-[#0B132B]">Coupon Details — <span className="font-mono text-[#14B8A6]">{showDetail.code}</span></h2>
              <button onClick={() => setShowDetail(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-400">Type:</span> <span className="font-medium capitalize">{showDetail.discountType}</span></div>
                <div><span className="text-slate-400">Value:</span> <span className="font-medium">{showDetail.discountType === "percentage" ? `${showDetail.discountValue}%` : `₹${showDetail.discountValue}`}</span></div>
                <div><span className="text-slate-400">Min Order:</span> <span className="font-medium">₹{showDetail.minOrderAmount}</span></div>
                <div><span className="text-slate-400">Max Discount:</span> <span className="font-medium">{showDetail.maxDiscount ? `₹${showDetail.maxDiscount}` : "No cap"}</span></div>
                <div><span className="text-slate-400">Used:</span> <span className="font-medium">{showDetail.usedCount}/{showDetail.usageLimit || "∞"}</span></div>
                <div><span className="text-slate-400">Per User:</span> <span className="font-medium">{showDetail.perUserLimit}</span></div>
                <div><span className="text-slate-400">Valid:</span> <span className="font-medium">{fmtDate(showDetail.validFrom)} — {fmtDate(showDetail.validTo)}</span></div>
                <div><span className="text-slate-400">Created:</span> <span className="font-medium">{fmtDate(showDetail.createdAt)}</span></div>
              </div>
              <div>
                <span className="text-slate-400 text-sm">Applies to:</span>
                <div className="flex gap-2 mt-1">{showDetail.applicableTo.map(a => (
                  <span key={a} className="text-xs font-medium uppercase px-2 py-1 rounded bg-blue-50 text-blue-600">{a}</span>
                ))}</div>
              </div>
              {/* Usage History */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Usage History ({showDetail.usageHistory?.length || 0})</h3>
                {(showDetail.usageHistory?.length || 0) === 0 ? (
                  <p className="text-xs text-slate-400">No usage yet.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-lg">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-slate-50"><th className="px-3 py-2 text-left">User</th><th className="px-3 py-2 text-left">Discount</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Date</th></tr></thead>
                      <tbody className="divide-y divide-slate-50">
                        {showDetail.usageHistory?.map((u: any, i: number) => (
                          <tr key={i}>
                            <td className="px-3 py-2">{u.user?.name || u.user?.phone || "—"}</td>
                            <td className="px-3 py-2 font-medium">₹{u.discountApplied}</td>
                            <td className="px-3 py-2 capitalize">{u.orderType}</td>
                            <td className="px-3 py-2">{fmtDate(u.usedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
