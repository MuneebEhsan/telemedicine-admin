"use client";

import { useEffect, useRef, useState } from "react";
import { Star, Trash2, CheckCircle, XCircle, Plus, Search, X, Package } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add review form
  const [addForm, setAddForm] = useState({ productId: "", rating: 5, title: "", body: "", reviewerName: "" });
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  // Product search
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced product search
  useEffect(() => {
    if (!productSearch.trim() || selectedProduct) {
      setProductResults([]);
      setDropdownOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await adminApi.getAdminProducts(`search=${encodeURIComponent(productSearch)}&limit=8`);
        if (data.success) {
          const list = Array.isArray(data.data) ? data.data : data.data?.products || [];
          setProductResults(list);
          setDropdownOpen(list.length > 0);
        }
      } catch {
        setProductResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [productSearch, selectedProduct]);

  const selectProduct = (product: any) => {
    setSelectedProduct(product);
    setAddForm((f) => ({ ...f, productId: product._id || product.id }));
    setProductSearch("");
    setDropdownOpen(false);
  };

  const clearProduct = () => {
    setSelectedProduct(null);
    setAddForm((f) => ({ ...f, productId: "" }));
    setProductSearch("");
  };

  const openAddModal = () => {
    setAddForm({ productId: "", rating: 5, title: "", body: "", reviewerName: "" });
    setSelectedProduct(null);
    setProductSearch("");
    setAddError(null);
    setAddModalOpen(true);
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      let query = `page=${page}&limit=20`;
      if (statusFilter) query += `&status=${statusFilter}`;
      const data = await adminApi.getAdminReviews(query);
      if (data.success) {
        setReviews(data.data || []);
        setPagination(data.pagination || null);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [page, statusFilter]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id + action);
    try {
      await adminApi.updateReviewStatus(id, action);
      loadReviews();
    } catch (err: any) {
      alert(err.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteReview(deleteId);
      setDeleteId(null);
      loadReviews();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  const handleAddReview = async () => {
    setAddError(null);
    if (!addForm.productId) {
      setAddError("Please select a product");
      return;
    }
    if (!addForm.body.trim()) {
      setAddError("Review text is required");
      return;
    }
    setAddLoading(true);
    try {
      await adminApi.addAdminReview({
        productId: addForm.productId,
        rating: addForm.rating,
        title: addForm.title,
        body: addForm.body,
        reviewerName: addForm.reviewerName,
      });
      setAddModalOpen(false);
      loadReviews();
    } catch (err: any) {
      setAddError(err.message || "Failed to add review");
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <>
      <Header title="Product Reviews" />

      <div className="p-8 max-w-7xl mx-auto animate-fade-in">
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Toolbar */}
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              {pagination && (
                <span className="text-sm text-slate-400">
                  {pagination.total} review{pagination.total !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <button onClick={openAddModal} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Review
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Review</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">Loading reviews...</td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">No reviews found.</td>
                  </tr>
                ) : (
                  reviews.map((review: any) => (
                    <tr key={review._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#0B132B] line-clamp-1">{review.product?.name || "—"}</p>
                        <p className="text-xs text-slate-400">{review.product?.slug || ""}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{review.reviewerName || review.user?.name || "—"}</p>
                        <p className="text-xs text-slate-400">{review.user?.phone || ""}</p>
                      </td>
                      <td className="px-6 py-4"><StarRow rating={review.rating} /></td>
                      <td className="px-6 py-4 max-w-xs">
                        {review.title && (
                          <p className="font-semibold text-[#0B132B] mb-0.5 line-clamp-1">{review.title}</p>
                        )}
                        <p className="text-slate-500 line-clamp-2 text-xs">{review.body}</p>
                        {review.isAdminReview && (
                          <span className="text-[10px] font-bold text-purple-600 border border-purple-200 rounded px-1 mt-1 inline-block">ADMIN</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-full border ${STATUS_COLORS[review.status] || ""}`}>
                          {review.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          {review.status === "pending" && (
                            <>
                              <button onClick={() => handleAction(review._id, "approve")} disabled={actionLoading === review._id + "approve"} title="Approve" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleAction(review._id, "reject")} disabled={actionLoading === review._id + "reject"} title="Reject" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {review.status === "rejected" && (
                            <button onClick={() => handleAction(review._id, "approve")} disabled={actionLoading === review._id + "approve"} title="Approve" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {review.status === "approved" && (
                            <button onClick={() => handleAction(review._id, "reject")} disabled={actionLoading === review._id + "reject"} title="Reject" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => setDeleteId(review._id)} title="Delete" className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-400">Page {pagination.page} of {pagination.totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrev} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors">Prev</button>
                <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNext} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-[#0B132B] mb-2">Delete Review</h3>
            <p className="text-slate-500 text-sm mb-6">This action cannot be undone. The product rating will be recalculated.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Review Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAddModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
            <h3 className="text-lg font-semibold text-[#0B132B] mb-6">Add Review</h3>

            <div className="space-y-4">
              {/* Product Search */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Product
                </label>

                {selectedProduct ? (
                  /* Selected product pill */
                  <div className="flex items-center gap-3 border border-[#14B8A6] bg-[#14B8A6]/5 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {selectedProduct.thumbnail ? (
                        <img src={selectedProduct.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#0B132B] text-sm truncate">{selectedProduct.name}</p>
                      <p className="text-xs text-slate-400 truncate">{selectedProduct.slug}</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearProduct}
                      className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* Search input + dropdown */
                  <div ref={searchRef} className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search products by name..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        onFocus={() => productResults.length > 0 && setDropdownOpen(true)}
                        className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
                        autoComplete="off"
                      />
                      {searchLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#14B8A6]/30 border-t-[#14B8A6] rounded-full animate-spin" />
                      )}
                    </div>

                    {/* Dropdown */}
                    {dropdownOpen && productResults.length > 0 && (
                      <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                        {productResults.map((p: any) => (
                          <button
                            key={p._id || p.id}
                            type="button"
                            onClick={() => selectProduct(p)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                          >
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                              {p.thumbnail ? (
                                <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#0B132B] text-sm truncate">{p.name}</p>
                              <p className="text-xs text-slate-400 truncate">{p.slug}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No results */}
                    {dropdownOpen && productResults.length === 0 && !searchLoading && productSearch.trim() && (
                      <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm text-slate-400 text-center">
                        No products found for "{productSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Rating */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => setAddForm((f) => ({ ...f, rating: s }))} className="transition-transform hover:scale-110">
                      <Star className={`w-6 h-6 ${s <= addForm.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Reviewer Name */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={addForm.reviewerName}
                  onChange={(e) => setAddForm((f) => ({ ...f, reviewerName: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
                />
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Title (optional)</label>
                <input
                  type="text"
                  placeholder="Review headline"
                  value={addForm.title}
                  onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Review Text</label>
                <textarea
                  rows={4}
                  placeholder="Write the review content..."
                  value={addForm.body}
                  onChange={(e) => setAddForm((f) => ({ ...f, body: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 resize-none"
                />
              </div>
            </div>

            {addError && <p className="text-red-500 text-sm mt-3">{addError}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setAddModalOpen(false); setAddError(null); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddReview}
                disabled={addLoading}
                className="flex-1 py-2.5 rounded-xl bg-[#14B8A6] text-white text-sm font-medium hover:bg-[#0F9E8D] transition-colors disabled:opacity-60"
              >
                {addLoading ? "Publishing..." : "Publish Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
      ))}
    </div>
  );
}
