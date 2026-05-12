"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  MapPin,
  CreditCard,
  Package,
  ExternalLink,
  FileText,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { formatDate, formatPrice, cn } from "@/lib/utils";

export default function PrescriptionOrderDetail() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<"approve" | "reject" | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getPrescriptionOrder(params.id as string);
      if (data.success) {
        setOrder(data.data?.prescriptionOrder || data.data);
      }
    } catch (error) {
      console.error("Failed to load prescription order:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) loadOrder();
  }, [params.id]);

  const handleReview = async () => {
    if (!reviewModal) return;
    if (reviewModal === "reject" && !reviewNote.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    try {
      setReviewLoading(true);
      await adminApi.reviewPrescription(params.id as string, reviewModal, reviewNote);
      setReviewModal(null);
      setReviewNote("");
      loadOrder();
    } catch (e: any) {
      alert(e.message || "Failed to review prescription");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!confirm(`Change order status to "${newStatus}"?`)) return;
    try {
      setStatusLoading(true);
      await adminApi.updateOrderStatus(order._id, newStatus);
      loadOrder();
    } catch (e: any) {
      alert(e.message || "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending_review: "bg-amber-500",
      approved: "bg-emerald-500",
      payment_pending: "bg-blue-500",
      confirmed: "bg-blue-600",
      packed: "bg-purple-500",
      dispatched: "bg-indigo-500",
      delivered: "bg-green-600",
      cancelled: "bg-red-500",
      rejected: "bg-red-500",
    };
    return map[status] || "bg-slate-400";
  };

  if (loading) {
    return (
      <>
        <Header title="Prescription Details" />
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header title="Prescription Details" />
        <div className="p-8 text-center text-slate-500">Order not found.</div>
      </>
    );
  }

  return (
    <>
      <Header title="Prescription Details" />

      <div className="p-8 max-w-5xl mx-auto animate-fade-in">
        {/* Back button + Order header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#0B132B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Prescriptions
          </button>
          <div className="flex items-center gap-3">
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white capitalize",
              getStatusColor(order.prescriptionStatus)
            )}>
              {order.prescriptionStatus === "pending_review" && <Clock className="w-3.5 h-3.5" />}
              {order.prescriptionStatus === "approved" && <CheckCircle className="w-3.5 h-3.5" />}
              {order.prescriptionStatus === "rejected" && <XCircle className="w-3.5 h-3.5" />}
              {order.prescriptionStatus?.replace(/_/g, " ")}
            </span>
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white capitalize",
              getStatusColor(order.orderStatus)
            )}>
              <Package className="w-3.5 h-3.5" />
              {order.orderStatus?.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Order Number */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-bold text-[#0B132B]">{order.orderNumber}</h2>
              <p className="text-sm text-slate-500 mt-1">Placed {formatDate(order.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#0B132B]">{formatPrice(order.totalAmount)}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Subtotal: {formatPrice(order.subtotal)} + Delivery: {formatPrice(order.deliveryCharge || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Product + Prescription Images */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Info */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Product</h3>
              <div className="flex items-start gap-4">
                {order.productSnapshot?.image && (
                  <img
                    src={order.productSnapshot.image}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover border border-slate-200"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-[#0B132B] text-base">{order.productSnapshot?.name}</h4>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                    <span>Price: {formatPrice(order.productSnapshot?.price || 0)}</span>
                    <span className="text-slate-400">MRP: {formatPrice(order.productSnapshot?.mrp || 0)}</span>
                    <span>Qty: <strong>{order.quantity}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prescription Images */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Prescription Images
              </h3>
              {order.prescriptionImages?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {order.prescriptionImages.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setImagePreview(img)}
                      className="aspect-[3/4] rounded-lg border border-slate-200 overflow-hidden hover:ring-2 hover:ring-[#8B5CF6]/40 transition-all group relative"
                    >
                      <img src={img} alt={`Rx ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No prescription images uploaded.</p>
              )}
            </div>

            {/* Status Timeline */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Status History</h3>
              <div className="space-y-4">
                {(order.statusHistory || []).map((entry: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn("w-3 h-3 rounded-full mt-1", getStatusColor(entry.status))} />
                      {i < order.statusHistory.length - 1 && (
                        <div className="w-0.5 h-8 bg-slate-200 mt-1" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0B132B] capitalize">{entry.status?.replace(/_/g, " ")}</p>
                      <p className="text-xs text-slate-500">{formatDate(entry.timestamp)}</p>
                      {entry.note && <p className="text-xs text-slate-600 mt-0.5 italic">"{entry.note}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Actions</h3>
              <div className="flex flex-wrap gap-3">
                {order.prescriptionStatus === "pending_review" && (
                  <>
                    <button
                      onClick={() => { setReviewModal("approve"); setReviewNote(""); }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve Prescription
                    </button>
                    <button
                      onClick={() => { setReviewModal("reject"); setReviewNote(""); }}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Reject Prescription
                    </button>
                  </>
                )}
                {order.orderStatus === "confirmed" && (
                  <button onClick={() => handleStatusUpdate("packed")} disabled={statusLoading} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    Mark as Packed
                  </button>
                )}
                {order.orderStatus === "packed" && (
                  <button onClick={() => handleStatusUpdate("dispatched")} disabled={statusLoading} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    Mark as Dispatched
                  </button>
                )}
                {order.orderStatus === "dispatched" && (
                  <button onClick={() => handleStatusUpdate("delivered")} disabled={statusLoading} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    Mark as Delivered
                  </button>
                )}
                {!["delivered", "cancelled", "rejected"].includes(order.orderStatus) && order.prescriptionStatus !== "pending_review" && (
                  <button onClick={() => handleStatusUpdate("cancelled")} disabled={statusLoading} className="px-5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right column: Patient, Payment, Shipping, Review */}
          <div className="space-y-6">
            {/* Patient Info */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Patient
              </h3>
              <p className="font-medium text-[#0B132B]">{order.user?.name || "N/A"}</p>
              <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {order.user?.phone || "N/A"}
              </p>
              {order.user?.email && (
                <p className="text-sm text-slate-600 mt-0.5">{order.user.email}</p>
              )}
            </div>

            {/* Payment Info */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payment
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className={cn("font-bold uppercase text-xs",
                    order.paymentStatus === "paid" ? "text-green-600" :
                    order.paymentStatus === "failed" ? "text-red-500" : "text-yellow-600"
                  )}>{order.paymentStatus}</span>
                </div>
                {order.easebuzzTxnId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Txn ID</span>
                    <span className="text-[#0B132B] font-mono text-xs">{order.easebuzzTxnId}</span>
                  </div>
                )}
                {order.paymentLink && (
                  <a
                    href={order.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1.5 text-xs text-[#8B5CF6] hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> Payment Link
                  </a>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Shipping
              </h3>
              {order.shippingAddress ? (
                <div className="text-sm text-slate-700 space-y-0.5">
                  <p className="font-medium">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.line1}</p>
                  {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                  {order.shippingAddress.landmark && <p className="text-slate-500">{order.shippingAddress.landmark}</p>}
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</p>
                  <p className="text-slate-500 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {order.shippingAddress.phone}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No address provided.</p>
              )}
            </div>

            {/* Review Info */}
            {order.reviewedBy && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Review Info</h3>
                <div className="text-sm space-y-1.5">
                  <p><span className="text-slate-500">Reviewed by:</span> <span className="font-medium">{order.reviewedBy?.name || "Admin"}</span></p>
                  <p><span className="text-slate-500">Date:</span> {order.reviewedAt ? formatDate(order.reviewedAt) : "N/A"}</p>
                  {order.reviewNote && (
                    <p className="mt-2 p-2 bg-slate-50 rounded-lg text-xs text-slate-600 italic">"{order.reviewNote}"</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReviewModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-display font-semibold text-[#0B132B] mb-1">
              {reviewModal === "approve" ? "Approve Prescription" : "Reject Prescription"}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {reviewModal === "approve"
                ? "A payment link will be sent to the patient via notification."
                : "Please provide a reason for rejection. The patient will be notified."}
            </p>
            <textarea
              placeholder={reviewModal === "approve" ? "Optional note for the patient..." : "Rejection reason (required)..."}
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
                  reviewModal === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                )}
              >
                {reviewLoading ? "Processing..." : reviewModal === "approve" ? "Approve & Send Link" : "Reject Prescription"}
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
          </div>
        </div>
      )}
    </>
  );
}
