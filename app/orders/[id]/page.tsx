"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, Clock, MapPin, CreditCard, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { formatDate, formatPrice, cn } from "@/lib/utils";

export default function AdminOrderDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAdminOrder(id);
      if (data.success) {
        setOrder(data.data.order || data.data);
      }
    } catch (error) {
      console.error("Failed to load order details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    if (confirm(`Change order status to ${newStatus}?`)) {
      try {
        await adminApi.updateOrderStatus(id, newStatus);
        loadOrder();
      } catch (e: any) {
        alert(e.message || "Failed to update order status");
      }
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Order Details" />
        <div className="flex justify-center items-center py-32">
           <div className="w-8 h-8 rounded-full border-4 border-[#14B8A6] border-t-transparent animate-spin" />
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header title="Order Details" />
        <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[40vh]">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Not Found</h2>
          <button onClick={() => router.back()} className="text-[#14B8A6] hover:underline">Go Back</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Order Details" />
      
      <div className="p-8 max-w-7xl mx-auto animate-fade-in">
        
        {/* Top Header Section */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
             <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#0B132B]">Order #{order.orderNumber}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
          <div className="ml-auto flex gap-2">
            {order.orderStatus === 'pending' && <button onClick={() => updateStatus('confirmed')} className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">Confirm Order</button>}
            {order.orderStatus === 'confirmed' && <button onClick={() => updateStatus('packed')} className="text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors">Mark Packed</button>}
            {order.orderStatus === 'packed' && <button onClick={() => updateStatus('dispatched')} className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors">Dispatch</button>}
            {order.orderStatus === 'dispatched' && <button onClick={() => updateStatus('delivered')} className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors">Mark Delivered</button>}
            {['pending', 'confirmed', 'packed'].includes(order.orderStatus) && (
              <button 
                onClick={() => updateStatus('cancelled')} 
                className="text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main Info Column */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Items */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                 <h3 className="font-semibold text-[#0B132B] flex items-center gap-2">
                   <Package className="w-5 h-5 text-slate-400" />
                   Order Items ({order.items?.length || 0})
                 </h3>
                 <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    {order.orderStatus}
                 </span>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                   {order.items?.map((item: any, idx: number) => (
                     <div key={idx} className="flex gap-4 items-center pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                       {item.image ? (
                         <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                       ) : (
                         <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                           <Package className="w-6 h-6 text-slate-300" />
                         </div>
                       )}
                       <div className="flex-1">
                          <p className="font-medium text-[#0B132B]">{item.name}</p>
                          <p className="text-sm text-slate-500">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                       </div>
                       <div className="font-bold text-[#0B132B]">
                          {formatPrice(item.total)}
                       </div>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            {/* Timeline View */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100">
                 <h3 className="font-semibold text-[#0B132B] flex items-center gap-2">
                   <Clock className="w-5 h-5 text-slate-400" />
                   Tracking Timeline
                 </h3>
               </div>
               <div className="p-6">
                  <div className="relative pl-4">
                    <div className="absolute left-[26px] top-2 bottom-2 w-px bg-slate-200 z-0"></div>
                    <div className="space-y-6 relative z-10">
                      {order.statusHistory?.map((history: any, idx: number) => {
                        const isLast = idx === order.statusHistory.length - 1;
                        return (
                          <div key={idx} className="flex gap-4">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ${isLast ? 'bg-[#14B8A6] text-white' : 'bg-slate-200 text-slate-500'} relative top-1`}>
                              <ChevronRight className="w-3 h-3" />
                            </div>
                            <div>
                               <p className={cn("capitalize font-bold text-sm", isLast ? 'text-[#14B8A6]' : 'text-slate-600')}>
                                 {history.status.replace(/_/g, ' ')}
                               </p>
                               {history.note && <p className="text-sm text-slate-500 mt-0.5">{history.note}</p>}
                               <p className="text-xs text-slate-400 mt-1">{formatDate(history.timestamp)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
               </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* Customer & Address */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100">
                 <h3 className="font-semibold text-[#0B132B] flex items-center gap-2">
                   <MapPin className="w-5 h-5 text-slate-400" />
                   Customer & Shipping
                 </h3>
               </div>
               <div className="p-6 text-sm">
                  <p className="font-bold text-[#0B132B] mb-1">{order.shippingAddress?.fullName}</p>
                  <p className="text-slate-500 mb-4">{order.shippingAddress?.phone}</p>
                  <hr className="border-slate-100 my-4" />
                  <p className="font-medium text-slate-700 mb-2">Delivery Address</p>
                  <p className="text-slate-600 leading-relaxed">
                     {order.shippingAddress?.line1}<br/>
                     {order.shippingAddress?.line2 && <>{order.shippingAddress.line2}<br/></>}
                     {order.shippingAddress?.landmark && <>{order.shippingAddress.landmark}<br/></>}
                     {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}
                  </p>
               </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100">
                 <h3 className="font-semibold text-[#0B132B] flex items-center gap-2">
                   <CreditCard className="w-5 h-5 text-slate-400" />
                   Payment Details
                 </h3>
               </div>
               <div className="p-6 space-y-3 text-sm">
                 <div className="flex justify-between">
                   <span className="text-slate-500">Subtotal</span>
                   <span className="font-medium text-slate-700">{formatPrice(order.subtotal)}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-slate-500">Delivery Charge</span>
                   <span className="font-medium text-slate-700">{formatPrice(order.deliveryCharge)}</span>
                 </div>
                 {order.discount > 0 && (
                   <div className="flex justify-between text-green-600">
                     <span>Discount</span>
                     <span className="font-medium">-{formatPrice(order.discount)}</span>
                   </div>
                 )}
                 <div className="pt-3 mt-1 border-t border-slate-100 flex justify-between items-center">
                   <span className="font-bold text-slate-700">Total Amount</span>
                   <span className="text-lg font-bold text-[#14B8A6]">{formatPrice(order.totalAmount)}</span>
                 </div>

                 <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                   <div className="flex justify-between items-center">
                     <span className="text-slate-500">Method</span>
                     <span className="font-bold text-slate-700 uppercase bg-slate-100 px-2 py-1 rounded text-xs">{order.paymentMethod}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-slate-500">Status</span>
                     <span className={cn("font-bold capitalize text-xs px-2 py-1 rounded", 
                        order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                     )}>
                       {order.paymentStatus}
                     </span>
                   </div>
                 </div>
               </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
