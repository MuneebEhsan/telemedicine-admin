"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string, name: string}>({isOpen: false, id: "", name: ""});

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAdminProducts(`page=${page}&search=${search}`);
      if (data.success) {
        setProducts(data.data.products || data.data); // depending on backend structure
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, search]);

  const promptDelete = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await adminApi.deleteProduct(deleteModal.id);
      setDeleteModal({ isOpen: false, id: "", name: "" });
      loadProducts();
    } catch (error: any) {
      alert(error.message || "Failed to delete product");
    }
  };

  const activeProducts = products.length > 0 && products[0] && Array.isArray(products) ? products : [];
  // The backend API might return data.products or directly an array under data depending on if there is pagination info.
  // Standardizing assuming it returns an array for this iteration as standard
  const productList = Array.isArray(products) ? products : (products as any).products || [];

  return (
    <>
      <Header title="Product Management" />
      
      <div className="p-8 max-w-7xl mx-auto animate-fade-in">
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <input
               type="text"
               placeholder="Search products..."
               className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-80 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all"
               value={search}
               onChange={(e) => {
                 setSearch(e.target.value);
                 setPage(1);
               }}
            />
            <div className="flex gap-2">
               <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 hover:bg-slate-50">Filter</button>
               <Link href="/products/create" className="btn-primary flex items-center gap-2">
                 <Plus className="w-4 h-4" /> Add Product
               </Link>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading products...</td>
                  </tr>
                ) : productList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No products found.</td>
                  </tr>
                ) : (
                  productList.map((product: any) => (
                    <tr key={product._id || product.id || Math.random()} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                            {product.thumbnail ? (
                              <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[#0B132B]">{product.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-400">{product.slug}</span>
                              {product.requiresPrescription && (
                                <span className="text-[10px] uppercase font-bold text-red-500 border border-red-200 rounded px-1">Rx</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#0B132B]">{formatPrice(product.price)}</p>
                        {product.mrp > product.price && (
                          <p className="text-xs text-slate-400 line-through">{formatPrice(product.mrp)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <span className={`font-medium ${product.stock <= (product.lowStockThreshold || 5) ? 'text-red-500' : 'text-green-600'}`}>
                             {product.stock}
                           </span>
                           <span className="text-xs text-slate-400">units</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                          ${product.status === 'active' ? 'bg-green-100 text-green-800' : 
                            product.status === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                            product.status === 'discontinued' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'}`}>
                          {product.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <Link href={`/products/${product._id}`} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                             <Edit className="w-4 h-4" />
                           </Link>
                           <button 
                             onClick={() => promptDelete(product._id, product.name)}
                             className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                           >
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

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden relative">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-[#0B132B]">Delete Product?</h2>
              <p className="text-sm text-slate-500">Are you sure you want to delete <span className="font-semibold">"{deleteModal.name}"</span>? This will permanently remove it from the inventory.</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-center gap-3 bg-slate-50">
               <button onClick={() => setDeleteModal({isOpen: false, id: "", name: ""})} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors w-full">Cancel</button>
               <button onClick={confirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors w-full">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
