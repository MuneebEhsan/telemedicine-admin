"use client";

import { useEffect, useState } from "react";
import { Search, FileCheck, CheckCircle, XCircle, Clock, Eye, ExternalLink } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { formatDate, formatPrice, cn } from "@/lib/utils";
import Link from "next/link";

export default function PrescriptionReviews() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reviewModal, setReviewModal] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      let query = `page=${page}&limit=20&search=${search}${statusFilter ? `&status=${statusFilter}` : ""}`;
      if (dateFrom) query += `&dateFrom=${dateFrom}`;
      if (dateTo) query += `&dateTo=${dateTo}`;
      const data = await adminApi.getPrescriptionOrders(query);
      if (data.success) {
        setOrders(data.data || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Failed to load prescription orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, search, statusFilter, dateFrom, dateTo]);

  const handleReview = async () => {
    if (!reviewModal) return;
    if (reviewModal.action === "reject" && !reviewNote.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    try {
      setReviewLoading(true);
      await adminApi.reviewPrescription(reviewModal.id, reviewModal.action, reviewNote);
      setReviewModal(null);
      setReviewNote("");
      loadOrders();
    } catch (e: any) {
      alert(e.message || "Failed to review prescription");
    } finally {
      setReviewLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending_review: "bg-amber-50 text-amber-800 border-amber-200",
      approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
      rejected: "bg-red-50 text-red-800 border-red-200",
    };
    const icons: Record<string, React.ReactNode> = {
      pending_review: <Clock className="w-3.5 h-3.5" />,
      approved: <CheckCircle className="w-3.5 h-3.5" />,
      rejected: <XCircle className="w-3.5 h-3.5" />,
    };
    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", styles[status] || "bg-slate-50 text-slate-800 border-slate-200")}>
        {icons[status]}
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  const getPaymentBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "text-yellow-600",
      paid: "text-green-600",
      failed: "text-red-500",
      cod_pending: "text-orange-600",
    };
    return <span className={cn("text-xs uppercase font-bold", styles[status] || "text-slate-500")}>{status}</span>;
  };

  const orderList = Array.isArray(orders) ? orders : [];

  return (
    <>
      <Header title="Prescription Reviews" />

      <div className="p-8 max-w-7xl mx-auto animate-fade-in">
        {/* Stats summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-amber-100 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0B132B]">
                {orderList.filter((o) => o.prescriptionStatus === "pending_review").length}
              </p>
              <p className="text-xs text-slate-500">Pending Review</p>
            </div>
          </div>
          <div className="bg-white border border-emerald-100 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0B132B]">
                {orderList.filter((o) => o.prescriptionStatus === "approved").length}
              </p>
              <p className="text-xs text-slate-500">Approved</p>
            </div>
          </div>
          <div className="bg-white border border-red-100 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0B132B]">
                {orderList.filter((o) => o.prescriptionStatus === "rejected").length}
              </p>
              <p className="text-xs text-slate-500">Rejected</p>
            </div>
          </div>
        </div>

        {/* Main table panel */}
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by order #, product..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex gap-2">
              <select
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#8B5CF6]/20"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#8B5CF6]/20"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                />
                <span className="text-slate-400 text-sm">to</span>
                <input
                  type="date"
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none focus:ring-2 focus:ring-[#8B5CF6]/20"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Order # & Date</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Prescription</th>
                  <th className="px-6 py-4">Rx Status</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
                        Loading prescriptions...
                      </div>
                    </td>
                  </tr>
                ) : orderList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      <FileCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No prescription orders found.
                    </td>
                  </tr>
                ) : (
                  orderList.map((order: any) => (
                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#0B132B]">{order.orderNumber}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{formatDate(order.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#0B132B]">{order.user?.name || "N/A"}</p>
                        <p className="text-xs text-slate-500">{order.user?.phone || ""}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {order.productSnapshot?.image && (
                            <img
                              src={order.productSnapshot.image}
                              alt=""
                              className="w-8 h-8 rounded-md object-cover border border-slate-200"
                            />
                          )}
                          <div>
                            <p className="font-medium text-[#0B132B] text-xs">{order.productSnapshot?.name || order.product?.name || "N/A"}</p>
                            <p className="text-xs text-slate-500">Qty: {order.quantity}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {order.prescriptionImages?.length > 0 ? (
                          <div className="flex gap-1">
                            {order.prescriptionImages.slice(0, 2).map((img: string, i: number) => (
                              <button
                                key={i}
                                onClick={() => setImagePreview(img)}
                                className="w-10 h-10 rounded-md border border-slate-200 overflow-hidden hover:ring-2 hover:ring-[#8B5CF6]/40 transition-all"
                              >
                                <img src={img} alt="Rx" className="w-full h-full object-cover" />
                              </button>
                            ))}
                            {order.prescriptionImages.length > 2 && (
                              <span className="text-xs text-slate-400 flex items-center">+{order.prescriptionImages.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No images</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(order.prescriptionStatus)}</td>
                      <td className="px-6 py-4">{getPaymentBadge(order.paymentStatus)}</td>
                      <td className="px-6 py-4 text-right font-medium text-[#0B132B]">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.prescriptionStatus === "pending_review" && (
                            <>
                              <button
                                onClick={() => {
                                  setReviewModal({ id: order._id, action: "approve" });
                                  setReviewNote("");
                                }}
                                className="text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setReviewModal({ id: order._id, action: "reject" });
                                  setReviewNote("");
                                }}
                                className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-200 transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <Link
                            href={`/prescriptions/${order._id}`}
                            className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
                          >
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-sm text-slate-500">
              Page {page} {total > 0 && `· ${total} total`}
            </span>
            <div className="space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={orderList.length < 20}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReviewModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-display font-semibold text-[#0B132B] mb-1">
              {reviewModal.action === "approve" ? "Approve Prescription" : "Reject Prescription"}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {reviewModal.action === "approve"
                ? "A payment link will be sent to the patient via notification."
                : "Please provide a reason for rejection. The patient will be notified."}
            </p>
            <textarea
              placeholder={reviewModal.action === "approve" ? "Optional note for the patient..." : "Rejection reason (required)..."}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setReviewModal(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={reviewLoading}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60",
                  reviewModal.action === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                )}
              >
                {reviewLoading
                  ? "Processing..."
                  : reviewModal.action === "approve"
                  ? "Approve & Send Link"
                  : "Reject Prescription"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {imagePreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setImagePreview(null)}>
          <div className="relative max-w-3xl max-h-[80vh]">
            <img src={imagePreview} alt="Prescription" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:text-red-500 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <a
              href={imagePreview}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-white flex items-center gap-1.5 shadow"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Full
            </a>
          </div>
        </div>
      )}
    </>
  );
}
