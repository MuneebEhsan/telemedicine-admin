"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import Link from "next/link";

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    price: 0,
    mrp: 0,
    images: [] as string[],
    thumbnail: "",
    category: "",
    subCategory: "",
    healthConditions: "",
    tags: "",
    badge: "none",
    requiresPrescription: false,
    stock: 0,
    lowStockThreshold: 10,
    manufacturer: "",
    composition: "",
    dosageForm: "",
    packSize: "",
    hsnCode: "",
    gstPercent: 12,
    status: "active"
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catResponse, subResponse] = await Promise.all([
           adminApi.getAdminCategories(),
           adminApi.getAdminSubCategories()
        ]);
        if (catResponse.success) {
          setCategories(catResponse.data.categories || catResponse.data);
        }
        if (subResponse.success) {
          setSubcategories(subResponse.data.subCategories || subResponse.data.categories || subResponse.data);
        }

        // Fetch Product Data if Editing
        if (params.id) {
          const prodResponse = await adminApi.getAdminProduct(params.id as string);
          if (prodResponse.success) {
             const prod = prodResponse.data.product || prodResponse.data;
             setFormData({
                name: prod.name || "",
                description: prod.description || "",
                shortDescription: prod.shortDescription || "",
                price: prod.price || 0,
                mrp: prod.mrp || 0,
                images: prod.images || [],
                thumbnail: prod.thumbnail || "",
                category: prod.category?._id || prod.category || "",
                subCategory: prod.subCategory?._id || prod.subCategory || "",
                healthConditions: Array.isArray(prod.healthConditions) ? prod.healthConditions.join(', ') : "",
                tags: Array.isArray(prod.tags) ? prod.tags.join(', ') : "",
                badge: prod.badge || "none",
                requiresPrescription: prod.requiresPrescription || false,
                stock: prod.stock || 0,
                lowStockThreshold: prod.lowStockThreshold || 10,
                manufacturer: prod.manufacturer || "",
                composition: prod.composition || "",
                dosageForm: prod.dosageForm || "",
                packSize: prod.packSize || "",
                hsnCode: prod.hsnCode || "",
                gstPercent: prod.gstPercent || 12,
                status: prod.status || "active"
             });
          }
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };
    fetchData();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'category') {
      // Whenever primary category changes, explicitly wipe any selected subCategory to avoid mismatch
      setFormData(prev => ({ ...prev, [name]: value, subCategory: "" }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (file.size > 5 * 1024 * 1024) {
      alert("Image exceeds the 5MB limit. Please upload a smaller image.");
      e.target.value = "";
      return;
    }

    setUploadingImage(true);
    try {
      const response = await adminApi.uploadAdminImage(file, "products");
      if (response.success && response.data?.url) {
        const newImages = [...formData.images, response.data.url];
        setFormData(prev => ({ 
           ...prev, 
           images: newImages,
           thumbnail: prev.thumbnail || response.data.url
        }));
      }
    } catch (error) {
      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newImages = formData.images.filter((_, i) => i !== indexToRemove);
    const newThumbnail = formData.thumbnail === formData.images[indexToRemove] 
        ? (newImages[0] || "") 
        : formData.thumbnail;
        
    setFormData(prev => ({ ...prev, images: newImages, thumbnail: newThumbnail }));
  };

  const setAsThumbnail = (url: string) => {
    setFormData(prev => ({ ...prev, thumbnail: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      return alert("Name and Category are required");
    }

    setLoading(true);
    try {
      // Process comma-separated strings to arrays
      const payload = {
        ...formData,
        healthConditions: formData.healthConditions.split(',').map(s => s.trim()).filter(Boolean),
        tags: formData.tags.split(',').map(s => s.trim()).filter(Boolean),
        badge: formData.badge === 'none' ? '' : formData.badge
      };
      
      // Some backends prefer subCategory to not be sent if it's empty
      if (!payload.subCategory) {
         delete (payload as any).subCategory;
      }

      await adminApi.updateProduct(params.id as string, payload);
      router.push('/products');
      router.refresh(); // Refresh the list
    } catch (error: any) {
      alert(error.message || "Failed to update product");
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Edit Product" />
      
      <div className="p-8 max-w-5xl mx-auto animate-fade-in pb-24">
        <form onSubmit={handleSubmit} className="space-y-8">
           
          {/* Action Header */}
          <div className="flex items-center justify-between">
             <Link href="/products" className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors">
               <ArrowLeft className="w-4 h-4" /> Back to Products
             </Link>
             <div className="flex items-center gap-3">
                <button type="button" onClick={() => router.push('/products')} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                   Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-6 py-2.5">
                   <Save className="w-4 h-4" /> {loading ? "Updating..." : "Update Product"}
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Left Column - Primary Details */}
             <div className="col-span-1 lg:col-span-2 space-y-8">
               
               {/* 1. Basic Information */}
               <div className="glass-panel p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                  <h3 className="text-base font-semibold text-[#0B132B] border-b border-slate-100 pb-3">Basic Information</h3>
                  
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" placeholder="e.g. Paracetamol 500mg table" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Short Description</label>
                        <input type="text" name="shortDescription" value={formData.shortDescription} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" placeholder="Brief summary (max 100 characters)" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Description</label>
                        <textarea name="description" rows={5} value={formData.description} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all resize-none" placeholder="Comprehensive product details..."></textarea>
                     </div>
                  </div>
               </div>

               {/* Media Uploads */}
               <div className="glass-panel p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                  <h3 className="text-base font-semibold text-[#0B132B] border-b border-slate-100 pb-3 flex items-center justify-between">
                     Product Images
                     {uploadingImage && <span className="text-xs text-[#14B8A6] animate-pulse">Uploading...</span>}
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {formData.images.map((url, index) => (
                        <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-50">
                           <img src={url} alt="Product img" className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                              {formData.thumbnail !== url && (
                                 <button type="button" onClick={() => setAsThumbnail(url)} className="text-[10px] font-medium bg-white text-slate-800 px-2 py-1 rounded shadow-sm hover:bg-slate-100">Set Thumbnail</button>
                              )}
                              <button type="button" onClick={() => removeImage(index)} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
                                 <X className="w-4 h-4" />
                              </button>
                           </div>
                           {formData.thumbnail === url && (
                              <div className="absolute top-2 left-2 bg-[#14B8A6] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">Thumbnail</div>
                           )}
                        </div>
                     ))}
                     
                     <label className="border-2 border-dashed border-slate-200 rounded-xl aspect-square flex flex-col items-center justify-center text-slate-400 hover:border-[#14B8A6] hover:bg-[#14B8A6]/5 transition-all cursor-pointer">
                        <Upload className="w-6 h-6 mb-2" />
                        <span className="text-xs font-medium">Add Image</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                     </label>
                  </div>
               </div>

               {/* Medical & Compliance */}
               <div className="glass-panel p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                  <h3 className="text-base font-semibold text-[#0B132B] border-b border-slate-100 pb-3">Medical Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturer</label>
                        <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Composition</label>
                        <input type="text" name="composition" value={formData.composition} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Dosage Form</label>
                        <input type="text" name="dosageForm" value={formData.dosageForm} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" placeholder="e.g. tablet, syrup" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pack Size</label>
                        <input type="text" name="packSize" value={formData.packSize} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" placeholder="e.g. 15 tablets" />
                     </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Health Conditions (comma separated)</label>
                        <input type="text" name="healthConditions" value={formData.healthConditions} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" placeholder="fever, headache, body-pain" />
                     </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Search Tags (comma separated)</label>
                        <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" placeholder="paracetamol, pain relief, generic" />
                     </div>
                  </div>
               </div>
         </div>

         {/* Right Column - Setup & Toggles */}
         <div className="col-span-1 space-y-8">
           
           {/* Organization */}
           <div className="glass-panel p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="text-base font-semibold text-[#0B132B] border-b border-slate-100 pb-3">Organization & Status</h3>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                    <select name="category" required value={formData.category} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all">
                       <option value="">-- Select Category --</option>
                       {categories.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                       ))}
                    </select>
                 </div>
                 
                 {formData.category && (
                    <div className="animate-fade-in">
                       <label className="block text-sm font-medium text-slate-700 mb-1">Subcategory</label>
                       <select name="subCategory" value={formData.subCategory} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all">
                          <option value="">-- Optional: Select SubCategory --</option>
                          {subcategories
                             .filter(sub => sub.parentCategory?._id === formData.category || sub.parentCategory === formData.category)
                             .map(sub => (
                                <option key={sub._id} value={sub._id}>{sub.name}</option>
                             ))
                          }
                       </select>
                    </div>
                 )}
                 
                 <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all">
                           <option value="active">Active</option>
                           <option value="draft">Draft</option>
                           <option value="archived">Archived</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Badge</label>
                        <select name="badge" value={formData.badge} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all">
                           <option value="none">None</option>
                           <option value="bestseller">Bestseller</option>
                           <option value="sale">Sale</option>
                           <option value="new">New</option>
                        </select>
                     </div>
                     <div className="pt-2 flex items-center gap-3">
                        <input type="checkbox" id="requiresPrescription" name="requiresPrescription" checked={formData.requiresPrescription} onChange={handleChange} className="w-4 h-4 text-[#14B8A6] rounded border-slate-300 focus:ring-[#14B8A6]" />
                        <label htmlFor="requiresPrescription" className="text-sm font-medium text-[#0B132B]">Requires Prescription (Rx)</label>
                     </div>
                  </div>
               </div>

               {/* Pricing & Inventory */}
               <div className="glass-panel p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                  <h3 className="text-base font-semibold text-[#0B132B] border-b border-slate-100 pb-3">Pricing & Inventory</h3>
                  
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">MRP (₹)</label>
                           <input type="number" min="0" step="0.01" name="mrp" value={formData.mrp} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price (₹)</label>
                           <input type="number" min="0" step="0.01" name="price" value={formData.price} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Stock Qty</label>
                           <input type="number" min="0" name="stock" value={formData.stock} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Low Stock Alert</label>
                           <input type="number" min="0" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">HSN Code</label>
                           <input type="text" name="hsnCode" value={formData.hsnCode} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">GST (%)</label>
                           <input type="number" min="0" max="100" name="gstPercent" value={formData.gstPercent} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all" />
                        </div>
                     </div>
                  </div>
               </div>

             </div>
          </div>
        </form>
      </div>
    </>
  );
}
