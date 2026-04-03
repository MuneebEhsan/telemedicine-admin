"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, FolderTree } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string, name: string}>({isOpen: false, id: "", name: ""});
  const [newCategory, setNewCategory] = useState({ name: "", description: "", image: "", isActive: true, sortOrder: 0 });

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAdminCategories();
      if (data.success) {
        setCategories(data.data.categories || data.data);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setNewCategory({ name: "", description: "", image: "", isActive: true, sortOrder: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (category: any) => {
    setEditingId(category._id);
    setNewCategory({
      name: category.name || "",
      description: category.description || "",
      image: category.image || "",
      isActive: category.isActive !== undefined ? category.isActive : true,
      sortOrder: category.sortOrder || 0
    });
    setIsModalOpen(true);
  };

  const handleCreateOrUpdate = async () => {
    if (!newCategory.name) return alert("Name is required");
    setCreating(true);
    try {
      if (editingId) {
        await adminApi.updateCategory(editingId, newCategory);
      } else {
        await adminApi.createCategory(newCategory);
      }
      setIsModalOpen(false);
      setNewCategory({ name: "", description: "", image: "", isActive: true, sortOrder: 0 });
      setEditingId(null);
      loadCategories();
    } catch (error: any) {
      alert(error.message || `Failed to ${editingId ? 'update' : 'create'} category`);
    } finally {
      setCreating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image exceeds the 5MB limit. Please upload a smaller image.");
      e.target.value = ""; // Clear the input
      return;
    }

    setUploadingImage(true);
    try {
      const response = await adminApi.uploadAdminImage(file, "categories");
      if (response.success && response.data?.url) {
         setNewCategory({...newCategory, image: response.data.url});
      }
    } catch (error) {
      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const promptDelete = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await adminApi.deleteCategory(deleteModal.id);
      setDeleteModal({ isOpen: false, id: "", name: "" });
      loadCategories();
    } catch (error: any) {
      alert(error.message || "Failed to delete category");
    }
  };

  const categoryList = Array.isArray(categories) ? categories : [];

  return (
    <>
      <Header title="Category Management" />
      
      <div className="p-8 max-w-5xl mx-auto animate-fade-in">
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-[#0B132B]">All Categories</h2>
            <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Sort Order</th>
                  <th className="px-6 py-4">Products Linked</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading categories...</td>
                  </tr>
                ) : categoryList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No categories found.</td>
                  </tr>
                ) : (
                  categoryList.map((category: any) => (
                    <tr key={category._id || category.id || Math.random()} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 text-2xl overflow-hidden shadow-sm">
                             {category.image ? (
                               <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                             ) : (
                               category.icon || <FolderTree className="w-5 h-5 text-slate-400" />
                             )}
                          </div>
                          <div>
                            <p className="font-medium text-[#0B132B]">{category.name}</p>
                            <p className="text-xs text-slate-400">{category.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                          ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{category.sortOrder || 0}</td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-[#0B132B] bg-slate-100 px-2.5 py-1 rounded-full">
                          {category.productCount || 0} products
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button onClick={() => openEditModal(category)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                             <Edit className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => promptDelete(category._id, category.name)}
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
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
               <h2 className="text-lg font-semibold text-[#0B132B]">{editingId ? "Edit Category" : "Add Category"}</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Image</label>
                  <div className="mt-1 flex items-center gap-4">
                     {newCategory.image ? (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                           <img src={newCategory.image} alt="Preview" className="w-full h-full object-cover" />
                           <button onClick={(e) => { e.preventDefault(); setNewCategory({...newCategory, image: ""}) }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs opacity-0 hover:opacity-100 transition-opacity">x</button>
                        </div>
                     ) : (
                        <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                           <FolderTree className="w-6 h-6 text-slate-300" />
                        </div>
                     )}
                     <div className="flex-1">
                        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} id="image_upload" className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#14B8A6]/10 file:text-[#0F3C3A] hover:file:bg-[#14B8A6]/20 transition-all focus:outline-none disabled:opacity-50" />
                        {uploadingImage && <p className="text-xs text-[#14B8A6] mt-1">Uploading...</p>}
                     </div>
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" value={newCategory.name} onChange={(e) => setNewCategory({...newCategory, name: e.target.value.replace(/[/()]/g, '')})} placeholder="e.g. Vitamins" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" value={newCategory.description} onChange={(e) => setNewCategory({...newCategory, description: e.target.value})} placeholder="Brief description..."></textarea>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex-1">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
                     <input type="number" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" value={newCategory.sortOrder} onChange={(e) => setNewCategory({...newCategory, sortOrder: Number(e.target.value)})} />
                  </div>
                  <div className="flex-1 flex items-center pt-6 space-x-2">
                     <input type="checkbox" id="isActive" checked={newCategory.isActive} onChange={(e) => setNewCategory({...newCategory, isActive: e.target.checked})} className="w-4 h-4 text-[#14B8A6] rounded border-slate-300 focus:ring-[#14B8A6]" />
                     <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Active Status</label>
                  </div>
               </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
               <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
               <button onClick={handleCreateOrUpdate} className="btn-primary" disabled={creating}>{creating ? "Saving..." : (editingId ? "Update Category" : "Create Category")}</button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden relative">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                <Trash2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-semibold text-[#0B132B]">Delete Category?</h2>
              <p className="text-sm text-slate-500">Are you sure you want to delete <span className="font-semibold">"{deleteModal.name}"</span>? This will permanently remove it.</p>
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
