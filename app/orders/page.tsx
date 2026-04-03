"use client";

import { useEffect, useState } from "react";
import { Search, Info, CheckCircle, PackageSearch, Truck, CheckCircle2, XCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { formatDate, formatPrice, cn } from "@/lib/utils";

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const query = `page=${page}&search=${search}${statusFilter ? `&status=${statusFilter}` : ""}`;
      const data = await adminApi.getAdminOrders(query);
      if (data.success) {
        setOrders(data.data.orders || data.data);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, search, statusFilter]);

  const updateStatus = async (id: string, newStatus: string) => {
    if (confirm(`Change order status to ${newStatus}?`)) {
      try {
         await adminApi.updateOrderStatus(id, newStatus);
         loadOrders();
      } catch (e: any) {
         alert(e.message || "Failed to update order status");
      }
    }
  }

  const orderList = Array.isArray(orders) ? orders : [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Info className="w-4 h-4 text-yellow-500" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'packed': return <PackageSearch className="w-4 h-4 text-purple-500" />;
      case 'dispatched': return <Truck className="w-4 h-4 text-indigo-500" />;
      case 'delivered': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <>
      <Header title="Order Management" />
      
      <div className="p-8 max-w-7xl mx-auto animate-fade-in">
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input
                 type="text"
                 placeholder="Search Order ID, Name..."
                 className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all"
                 value={search}
                 onChange={(e) => {
                   setSearch(e.target.value);
                   setPage(1);
                 }}
               />
            </div>
            
            <div className="flex gap-2 items-center">
               <select 
                 className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none"
                 value={statusFilter}
                 onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                 }}
               >
                 <option value="">All Statuses</option>
                 <option value="pending">Pending</option>
                 <option value="confirmed">Confirmed</option>
                 <option value="packed">Packed</option>
                 <option value="dispatched">Dispatched</option>
                 <option value="delivered">Delivered</option>
                 <option value="cancelled">Cancelled</option>
               </select>
               <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 hover:bg-slate-50 relative">
                 Export PDF
               </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Order ID & Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading orders...</td>
                  </tr>
                ) : orderList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No orders found.</td>
                  </tr>
                ) : (
                  orderList.map((order: any) => (
                    <tr key={order.orderNumber || Math.random()} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#0B132B]">{order.orderNumber}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{formatDate(order.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#0B132B]">{order.user?.name || (order.shippingAddress && order.shippingAddress.fullName) || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{order.user?.phone || (order.shippingAddress && order.shippingAddress.phone) || ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium capitalize border",
                          order.orderStatus === 'pending' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 
                          order.orderStatus === 'confirmed' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          order.orderStatus === 'packed' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                          order.orderStatus === 'dispatched' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                          order.orderStatus === 'delivered' ? 'bg-green-50 text-green-800 border-green-200' :
                          order.orderStatus === 'cancelled' ? 'bg-red-50 text-red-800 border-red-200' :
                          'bg-slate-50 text-slate-800 border-slate-200'
                        )}>
                          {getStatusIcon(order.orderStatus)}
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium capitalize text-slate-700">{order.paymentMethod}</p>
                        <p className={cn("text-xs uppercase font-bold mt-0.5", 
                          order.paymentStatus === 'paid' ? 'text-green-600' : 
                          order.paymentStatus === 'failed' ? 'text-red-500' : 'text-yellow-600'
                        )}>
                          {order.paymentStatus}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-[#0B132B]">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           {order.orderStatus === 'pending' && <button onClick={() => updateStatus(order._id, 'confirmed')} className="text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors">Confirm</button>}
                           {order.orderStatus === 'confirmed' && <button onClick={() => updateStatus(order._id, 'packed')} className="text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg border border-purple-200 transition-colors">Pack</button>}
                           {order.orderStatus === 'packed' && <button onClick={() => updateStatus(order._id, 'dispatched')} className="text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-colors">Dispatch</button>}
                           {order.orderStatus === 'dispatched' && <button onClick={() => updateStatus(order._id, 'delivered')} className="text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg border border-green-200 transition-colors">Deliver</button>}
                           
                           {/* Detail Button */}
                           <button className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors">Details</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
             <span className="text-sm text-slate-500">Page {page}</span>
             <div className="space-x-2">
                <button
                   disabled={page === 1}
                   onClick={() => setPage(page => Math.max(1, page - 1))}
                   className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white hover:bg-slate-50 disabled:opacity-50"
                >
                   Previous
                </button>
                <button
                   onClick={() => setPage(page => page + 1)}
                   className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white hover:bg-slate-50"
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
