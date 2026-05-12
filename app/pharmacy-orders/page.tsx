"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  PackageCheck,
  PackageSearch,
  Truck,
  CheckCircle2,
  XCircle,
  Info,
  CheckCircle,
  Pill,
  ShoppingCart,
  Filter,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { formatDate, formatPrice, cn } from "@/lib/utils";
import Link from "next/link";

type TabFilter = "all" | "confirmed" | "packed" | "dispatched" | "delivered";

export default function PharmacyOrders() {
  const [regularOrders, setRegularOrders] = useState<any[]>([]);
  const [rxOrders, setRxOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const [regData, rxData] = await Promise.all([
        adminApi.getAdminOrders(`page=1&limit=100`),
        adminApi.getPrescriptionOrders(`page=1&limit=100`),
      ]);

      if (regData.success) setRegularOrders(regData.data?.orders || regData.data || []);
      if (rxData.success) setRxOrders(rxData.data || []);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Merge and normalize orders from both sources
  const allOrders = useMemo(() => {
    const normalized: any[] = [];

    (Array.isArray(regularOrders) ? regularOrders : []).forEach((o) => {
      normalized.push({
        ...o,
        _type: "regular",
        _customerName: o.user?.name || o.shippingAddress?.fullName || "Unknown",
        _customerPhone: o.user?.phone || o.shippingAddress?.phone || "",
        _itemSummary: o.items?.length ? `${o.items.length} item(s)` : "No items",
      });
    });

    (Array.isArray(rxOrders) ? rxOrders : []).forEach((o) => {
      // Only include prescription orders that have been approved and are in the fulfillment pipeline
      const fulfillmentStatuses = ["approved", "confirmed", "packed", "dispatched", "delivered"];
      if (!fulfillmentStatuses.includes(o.orderStatus)) return;

      normalized.push({
        ...o,
        _type: "prescription",
        _customerName: o.user?.name || o.shippingAddress?.fullName || "Unknown",
        _customerPhone: o.user?.phone || o.shippingAddress?.phone || "",
        _itemSummary: o.productSnapshot?.name || o.product?.name || "Rx Product",
      });
    });

    // Sort by created date, newest first
    normalized.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return normalized;
  }, [regularOrders, rxOrders]);

  // Filter by tab and search
  const filteredOrders = useMemo(() => {
    let filtered = allOrders;

    if (tab !== "all") {
      filtered = filtered.filter((o) => o.orderStatus === tab);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o._customerName?.toLowerCase().includes(q) ||
          o._customerPhone?.includes(q)
      );
    }

    return filtered;
  }, [allOrders, tab, search]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    all: allOrders.length,
    confirmed: allOrders.filter((o) => o.orderStatus === "confirmed").length,
    packed: allOrders.filter((o) => o.orderStatus === "packed").length,
    dispatched: allOrders.filter((o) => o.orderStatus === "dispatched").length,
    delivered: allOrders.filter((o) => o.orderStatus === "delivered").length,
  }), [allOrders]);

  const updateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Change order status to "${newStatus}"?`)) return;
    try {
      setStatusLoading(id);
      await adminApi.updateOrderStatus(id, newStatus);
      loadOrders();
    } catch (e: any) {
      alert(e.message || "Failed to update order status");
    } finally {
      setStatusLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Info className="w-3.5 h-3.5 text-yellow-500" />;
      case "confirmed": return <CheckCircle className="w-3.5 h-3.5 text-blue-500" />;
      case "approved": return <CheckCircle className="w-3.5 h-3.5 text-blue-500" />;
      case "packed": return <PackageSearch className="w-3.5 h-3.5 text-purple-500" />;
      case "dispatched": return <Truck className="w-3.5 h-3.5 text-indigo-500" />;
      case "delivered": return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
      case "cancelled": return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-50 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-50 text-blue-800 border-blue-200",
      approved: "bg-blue-50 text-blue-800 border-blue-200",
      packed: "bg-purple-50 text-purple-800 border-purple-200",
      dispatched: "bg-indigo-50 text-indigo-800 border-indigo-200",
      delivered: "bg-green-50 text-green-800 border-green-200",
      cancelled: "bg-red-50 text-red-800 border-red-200",
    };
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize border",
        styles[status] || "bg-slate-50 text-slate-800 border-slate-200"
      )}>
        {getStatusIcon(status)}
        {status}
      </span>
    );
  };

  const tabs: { key: TabFilter; label: string; icon: any }[] = [
    { key: "all", label: "All Orders", icon: Filter },
    { key: "confirmed", label: "Confirmed", icon: CheckCircle },
    { key: "packed", label: "Packed", icon: PackageCheck },
    { key: "dispatched", label: "Dispatched", icon: Truck },
    { key: "delivered", label: "Delivered", icon: CheckCircle2 },
  ];

  // Paginate
  const PER_PAGE = 25;
  const totalPages = Math.ceil(filteredOrders.length / PER_PAGE);
  const pageOrders = filteredOrders.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <Header title="Pharmacy Orders" />

      <div className="p-8 max-w-7xl mx-auto animate-fade-in">
        {/* Tab Bar */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200",
                tab === t.key
                  ? "bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-sm shadow-[#8B5CF6]/20"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              <span className={cn(
                "ml-1 min-w-[20px] text-center px-1.5 py-0.5 rounded-full text-xs font-bold",
                tab === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              )}>
                {tabCounts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Main panel */}
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
          {/* Search bar */}
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by order #, customer..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Order # & Date</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Status</th>
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
                        Loading orders...
                      </div>
                    </td>
                  </tr>
                ) : pageOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      <PackageSearch className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No orders found for this filter.
                    </td>
                  </tr>
                ) : (
                  pageOrders.map((order: any) => (
                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#0B132B]">{order.orderNumber}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{formatDate(order.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4">
                        {order._type === "prescription" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium">
                            <Pill className="w-3 h-3" /> Rx
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium">
                            <ShoppingCart className="w-3 h-3" /> Regular
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#0B132B]">{order._customerName}</p>
                        <p className="text-xs text-slate-500">{order._customerPhone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-700">{order._itemSummary}</p>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.orderStatus)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium capitalize text-slate-700 text-xs">{order.paymentMethod || "N/A"}</p>
                        <p className={cn("text-xs uppercase font-bold mt-0.5",
                          order.paymentStatus === "paid" ? "text-green-600" :
                          order.paymentStatus === "failed" ? "text-red-500" : "text-yellow-600"
                        )}>
                          {order.paymentStatus}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-[#0B132B]">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.orderStatus === "pending" && (
                            <button
                              onClick={() => updateStatus(order._id, "confirmed")}
                              disabled={statusLoading === order._id}
                              className="text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors disabled:opacity-50"
                            >
                              Confirm
                            </button>
                          )}
                          {(order.orderStatus === "confirmed" || order.orderStatus === "approved") && (
                            <button
                              onClick={() => updateStatus(order._id, "packed")}
                              disabled={statusLoading === order._id}
                              className="text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg border border-purple-200 transition-colors disabled:opacity-50"
                            >
                              Pack
                            </button>
                          )}
                          {order.orderStatus === "packed" && (
                            <button
                              onClick={() => updateStatus(order._id, "dispatched")}
                              disabled={statusLoading === order._id}
                              className="text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-colors disabled:opacity-50"
                            >
                              Dispatch
                            </button>
                          )}
                          {order.orderStatus === "dispatched" && (
                            <button
                              onClick={() => updateStatus(order._id, "delivered")}
                              disabled={statusLoading === order._id}
                              className="text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg border border-green-200 transition-colors disabled:opacity-50"
                            >
                              Deliver
                            </button>
                          )}
                          <Link
                            href={order._type === "prescription" ? `/prescriptions/${order._id}` : `/orders/${order._id}`}
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
              Page {page} of {Math.max(1, totalPages)} · {filteredOrders.length} orders
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
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
