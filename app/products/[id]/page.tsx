"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import Link from "next/link";
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [activeEmojiPicker, setActiveEmojiPicker] = useState<number | null>(null);

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
    status: "active",
    howItWorks: [] as { icon: string, title: string, description: string, image?: string, video?: string }[],
    howToUse: [] as { step: number, title: string, description: string, image?: string, video?: string }[],
    videoUrl: ""
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
                status: prod.status || "active",
                howItWorks: prod.howItWorks || [],
                howToUse: prod.howToUse || [],
                videoUrl: prod.videoUrl || ""
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // 20MB limit for video
    if (file.size > 20 * 1024 * 1024) {
      alert("Video exceeds the 20MB limit. Please upload a smaller file.");
      e.target.value = "";
      return;
    }

    setUploadingVideo(true);
    try {
      const response = await adminApi.uploadAdminVideo(file, "products");
      if (response.success && response.data?.url) {
        setFormData(prev => ({ ...prev, videoUrl: response.data.url }));
      }
    } catch (error) {
      alert("Failed to upload video");
    } finally {
      setUploadingVideo(false);
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

  const handleArrayImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'howItWorks' | 'howToUse', index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) return alert("Image exceeds 5MB limit.");

    try {
      const response = await adminApi.uploadAdminImage(file, "products");
      if (response.success && response.data?.url) {
        setFormData(prev => {
          const newArray = [...prev[type]] as any[];
          newArray[index].image = response.data.url;
          return { ...prev, [type]: newArray };
        });
      }
    } catch (error) {
      alert("Failed to upload image");
    }
  };

  const handleArrayVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'howItWorks' | 'howToUse', index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 20 * 1024 * 1024) return alert("Video exceeds 20MB limit.");

    try {
      const response = await adminApi.uploadAdminVideo(file, "products");
      if (response.success && response.data?.url) {
        setFormData(prev => {
          const newArray = [...prev[type]] as any[];
          newArray[index].video = response.data.url;
          return { ...prev, [type]: newArray };
        });
      }
    } catch (error) {
      alert("Failed to upload video");
    }
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
        badge: formData.badge === 'none' ? '' : formData.badge,
        howItWorks: formData.howItWorks,
        howToUse: formData.howToUse
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
                        <div className="bg-white rounded-lg overflow-hidden">
                           <ReactQuill 
                              theme="snow" 
                              value={formData.description} 
                              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))} 
                              className="h-48 mb-12"
                           />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Media Uploads */}
               <div className="glass-panel p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                  <h3 className="text-base font-semibold text-[#0B132B] border-b border-slate-100 pb-3 flex items-center justify-between">
                     Product Media
                     {uploadingImage && <span className="text-xs text-[#14B8A6] animate-pulse">Uploading...</span>}
                  </h3>
                  
                  <div className="space-y-6">
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

                    <div className="pt-4 border-t border-slate-100">
                       <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center justify-between">
                          Product Video
                          {uploadingVideo && <span className="text-xs text-[#14B8A6] animate-pulse">Uploading Video...</span>}
                       </label>
                       
                       <div className="flex flex-col gap-3">
                          {formData.videoUrl ? (
                             <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-black flex items-center justify-center">
                                <video src={formData.videoUrl} className="w-full h-full object-contain" controls />
                                <button 
                                   type="button" 
                                   onClick={() => setFormData(prev => ({ ...prev, videoUrl: "" }))} 
                                   className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                   <X className="w-4 h-4" />
                                </button>
                             </div>
                          ) : (
                             <label className="border-2 border-dashed border-slate-200 rounded-xl py-8 flex flex-col items-center justify-center text-slate-400 hover:border-[#14B8A6] hover:bg-[#14B8A6]/5 transition-all cursor-pointer">
                                <Upload className="w-8 h-8 mb-2" />
                                <span className="text-sm font-medium">Upload Product Video</span>
                                <span className="text-[10px] text-slate-400 mt-1">MP4, WebM (Max 20MB)</span>
                                <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} disabled={uploadingVideo} />
                             </label>
                          )}
                          
                          <div className="relative">
                             <input 
                                type="text" 
                                name="videoUrl" 
                                value={formData.videoUrl} 
                                onChange={handleChange} 
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 transition-all pr-20" 
                                placeholder="Or paste Cloudinary/Direct Link here..." 
                             />
                             <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <span className="text-[10px] font-bold text-slate-300 uppercase">Direct Link</span>
                             </div>
                          </div>
                       </div>
                    </div>
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
               
               {/* 4. How It Works Section */}
               <div className={`glass-panel p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 relative ${activeEmojiPicker !== null ? 'z-50' : 'z-10'}`}>
                  <h3 className="text-base font-semibold text-[#0B132B] border-b border-slate-100 pb-3 flex items-center justify-between">
                     How It Works
                     <button type="button" onClick={() => setFormData(prev => ({ ...prev, howItWorks: [...prev.howItWorks, { icon: '✅', title: '', description: '' }] }))} className="text-xs font-bold text-[#14B8A6] hover:underline">+ Add Point</button>
                  </h3>
                  
                  <div className="space-y-4">
                     {formData.howItWorks.map((item, index) => (
                        <div key={index} className={`p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 relative ${activeEmojiPicker === index ? 'z-50' : 'z-10'}`}>
                           <button type="button" onClick={() => setFormData(prev => ({ ...prev, howItWorks: prev.howItWorks.filter((_, i) => i !== index) }))} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">
                              <X className="w-4 h-4" />
                           </button>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="relative">
                                 <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Icon (Emoji)</label>
                                 <button
                                    type="button"
                                    onClick={() => setActiveEmojiPicker(activeEmojiPicker === index ? null : index)}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none flex justify-between items-center text-left h-[34px]"
                                 >
                                    <span className="text-lg leading-none">{item.icon || '✅'}</span>
                                 </button>
                                 {activeEmojiPicker === index && (
                                    <div className="absolute top-full left-0 z-50 mt-1 shadow-xl">
                                       <EmojiPicker 
                                          onEmojiClick={(emojiData) => {
                                             const newHW = [...formData.howItWorks];
                                             newHW[index].icon = emojiData.emoji;
                                             setFormData(prev => ({ ...prev, howItWorks: newHW }));
                                             setActiveEmojiPicker(null);
                                          }} 
                                       />
                                    </div>
                                 )}
                              </div>
                              <div>
                                 <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Title</label>
                                 <input type="text" value={item.title} onChange={(e) => {
                                    const newHW = [...formData.howItWorks];
                                    newHW[index].title = e.target.value;
                                    setFormData(prev => ({ ...prev, howItWorks: newHW }));
                                 }} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none" placeholder="e.g. Fast Acting" />
                              </div>
                           </div>
                           <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description</label>
                              <textarea rows={2} value={item.description} onChange={(e) => {
                                 const newHW = [...formData.howItWorks];
                                 newHW[index].description = e.target.value;
                                 setFormData(prev => ({ ...prev, howItWorks: newHW }));
                              }} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none resize-none" placeholder="Describe how it works..."></textarea>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Optional Image</label>
                                 <div className="flex items-center gap-2">
                                    {item.image && <img src={item.image} alt="How it works" className="w-8 h-8 rounded object-cover" />}
                                    <input type="file" accept="image/*" onChange={(e) => handleArrayImageUpload(e, 'howItWorks', index)} className="text-xs w-full" />
                                 </div>
                              </div>
                              <div>
                                 <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Optional Video</label>
                                 <div className="flex items-center gap-2">
                                    {item.video && <video src={item.video} className="w-8 h-8 rounded object-cover" />}
                                    <input type="file" accept="video/*" onChange={(e) => handleArrayVideoUpload(e, 'howItWorks', index)} className="text-xs w-full" />
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                     {formData.howItWorks.length === 0 && <p className="text-xs text-slate-400 italic">No points added yet.</p>}
                  </div>
               </div>

               {/* 5. How To Use Section */}
               <div className="glass-panel p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                  <h3 className="text-base font-semibold text-[#0B132B] border-b border-slate-100 pb-3 flex items-center justify-between">
                     How To Use Steps
                     <button type="button" onClick={() => setFormData(prev => ({ ...prev, howToUse: [...prev.howToUse, { step: prev.howToUse.length + 1, title: '', description: '' }] }))} className="text-xs font-bold text-[#14B8A6] hover:underline">+ Add Step</button>
                  </h3>
                  
                  <div className="space-y-4">
                     {formData.howToUse.map((item, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 relative">
                           <button type="button" onClick={() => setFormData(prev => ({ ...prev, howToUse: prev.howToUse.filter((_, i) => i !== index) }))} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">
                              <X className="w-4 h-4" />
                           </button>
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#14B8A6] text-white flex items-center justify-center font-bold text-sm shrink-0">
                                 {index + 1}
                              </div>
                              <div className="flex-1">
                                 <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Step Title</label>
                                 <input type="text" value={item.title} onChange={(e) => {
                                    const newHU = [...formData.howToUse];
                                    newHU[index].title = e.target.value;
                                    setFormData(prev => ({ ...prev, howToUse: newHU }));
                                 }} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none" placeholder="e.g. Shake well" />
                              </div>
                           </div>
                           <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Step Description</label>
                              <textarea rows={2} value={item.description} onChange={(e) => {
                                 const newHU = [...formData.howToUse];
                                 newHU[index].description = e.target.value;
                                 setFormData(prev => ({ ...prev, howToUse: newHU }));
                              }} className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none resize-none" placeholder="Instructions for this step..."></textarea>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Optional Image</label>
                                 <div className="flex items-center gap-2">
                                    {item.image && <img src={item.image} alt="How to use" className="w-8 h-8 rounded object-cover" />}
                                    <input type="file" accept="image/*" onChange={(e) => handleArrayImageUpload(e, 'howToUse', index)} className="text-xs w-full" />
                                 </div>
                              </div>
                              <div>
                                 <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Optional Video</label>
                                 <div className="flex items-center gap-2">
                                    {item.video && <video src={item.video} className="w-8 h-8 rounded object-cover" />}
                                    <input type="file" accept="video/*" onChange={(e) => handleArrayVideoUpload(e, 'howToUse', index)} className="text-xs w-full" />
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                     {formData.howToUse.length === 0 && <p className="text-xs text-slate-400 italic">No steps added yet.</p>}
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
