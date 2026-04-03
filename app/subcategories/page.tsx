"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, FolderTree } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";

export default function SubCategories() {
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string, name: string}>({isOpen: false, id: "", name: ""});
  const [newSubCategory, setNewSubCategory] = useState({ name: "", description: "", image: "", isActive: true, sortOrder: 0, parentCategory: "" });

  const loadData = async () => {
    try {
      setLoading(true);
      const [subData, catData] = await Promise.all([
        adminApi.getAdminSubCategories(),
        adminApi.getAdminCategories()
      ]);
      if (subData.success) {
        setSubcategories(subData.data.subCategories || subData.data.categories || subData.data);
      }
      if (catData.success) {
        setCategories(catData.data.categories || catData.data);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setNewSubCategory({ name: "", description: "", image: "", isActive: true, sortOrder: 0, parentCategory: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (subCat: any) => {
    setEditingId(subCat._id);
    setNewSubCategory({
      name: subCat.name || "",
      description: subCat.description || "",
      image: subCat.image || "",
      isActive: subCat.isActive !== undefined ? subCat.isActive : true,
      sortOrder: subCat.sortOrder || 0,
      parentCategory: subCat.parentCategory?._id || subCat.parentCategory || ""
    });
    setIsModalOpen(true);
  };

  const handleCreateOrUpdate = async () => {
    if (!newSubCategory.name) return alert("Name is required");
    if (!newSubCategory.parentCategory) return alert("Parent Category is required");
    setCreating(true);
    try {
      if (editingId) {
        await adminApi.updateSubCategory(editingId, newSubCategory);
      } else {
        await adminApi.createSubCategory(newSubCategory);
      }
      setIsModalOpen(false);
      setNewSubCategory({ name: "", description: "", image: "", isActive: true, sortOrder: 0, parentCategory: "" });
      setEditingId(null);
      loadData();
    } catch (error: any) {
      alert(error.message || `Failed to ${editingId ? 'update' : 'create'} subcategory`);
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
         setNewSubCategory({...newSubCategory, image: response.data.url});
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
      await adminApi.deleteSubCategory(deleteModal.id);
      setDeleteModal({ isOpen: false, id: "", name: "" });
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to delete subcategory");
    }
  };

  const subcategoryList = Array.isArray(subcategories) ? subcategories : [];

  return (
    <>
      <Header title="SubCategory Management" />
      
      <div className="p-8 max-w-5xl mx-auto animate-fade-in">
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-[#0B132B]">All SubCategories</h2>
            <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add SubCategory
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">SubCategory</th>
                  <th className="px-6 py-4">Parent Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Loading subcategories...</td>
                  </tr>
                ) : subcategoryList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No subcategories found.</td>
                  </tr>
                ) : (
                  subcategoryList.map((sub: any) => (
                    <tr key={sub._id || sub.id || Math.random()} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 text-2xl overflow-hidden shadow-sm">
                             {sub.image ? (
                               <img src={sub.image} alt={sub.name} className="w-full h-full object-cover" />
                             ) : (
                               sub.icon || <FolderTree className="w-5 h-5 text-slate-400" />
                             )}
                          </div>
                          <div>
                            <p className="font-medium text-[#0B132B]">{sub.name}</p>
                            <p className="text-xs text-slate-400">{sub.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {sub.parentCategory ? (
                           <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                             {sub.parentCategory.name || "Unknown"}
                           </span>
                        ) : (
                           <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize
                          ${sub.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                          {sub.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button onClick={() => openEditModal(sub)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                             <Edit className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => promptDelete(sub._id, sub.name)}
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
               <h2 className="text-lg font-semibold text-[#0B132B]">{editingId ? "Edit SubCategory" : "Add SubCategory"}</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Image</label>
                  <div className="mt-1 flex items-center gap-4">
                     {newSubCategory.image ? (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                           <img src={newSubCategory.image} alt="Preview" className="w-full h-full object-cover" />
                           <button onClick={(e) => { e.preventDefault(); setNewSubCategory({...newSubCategory, image: ""}) }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs opacity-0 hover:opacity-100 transition-opacity">x</button>
                        </div>
                     ) : (
                        <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                           <FolderTree className="w-6 h-6 text-slate-300" />
                        </div>
                     )}
                     <div className="flex-1">
                        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#14B8A6]/10 file:text-[#0F3C3A] hover:file:bg-[#14B8A6]/20 transition-all focus:outline-none disabled:opacity-50" />
                        {uploadingImage && <p className="text-xs text-[#14B8A6] mt-1">Uploading...</p>}
                     </div>
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" value={newSubCategory.name} onChange={(e) => setNewSubCategory({...newSubCategory, name: e.target.value.replace(/[/()]/g, '')})} placeholder="e.g. Pain Killers" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Parent Category</label>
                  <select 
                     className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20"
                     value={newSubCategory.parentCategory}
                     onChange={(e) => setNewSubCategory({...newSubCategory, parentCategory: e.target.value})}
                  >
                     <option value="">-- Select Parent Category --</option>
                     {categories.map((cat: any) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                     ))}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" value={newSubCategory.description} onChange={(e) => setNewSubCategory({...newSubCategory, description: e.target.value})} placeholder="Brief description..."></textarea>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex-1">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
                     <input type="number" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" value={newSubCategory.sortOrder} onChange={(e) => setNewSubCategory({...newSubCategory, sortOrder: Number(e.target.value)})} />
                  </div>
                  <div className="flex-1 flex items-center pt-6 space-x-2">
                     <input type="checkbox" id="isActiveSub" checked={newSubCategory.isActive} onChange={(e) => setNewSubCategory({...newSubCategory, isActive: e.target.checked})} className="w-4 h-4 text-[#14B8A6] rounded border-slate-300 focus:ring-[#14B8A6]" />
                     <label htmlFor="isActiveSub" className="text-sm font-medium text-slate-700">Active Status</label>
                  </div>
               </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
               <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
               <button onClick={handleCreateOrUpdate} className="btn-primary" disabled={creating}>{creating ? "Saving..." : (editingId ? "Update SubCategory" : "Create SubCategory")}</button>
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
              <h2 className="text-lg font-semibold text-[#0B132B]">Delete SubCategory?</h2>
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
