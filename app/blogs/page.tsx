"use client";

import { useToast } from "@/lib/toast-context";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { adminApi } from "@/lib/api";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
      Loading Editor...
    </div>
  ),
});

// Helper to slugify title
const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-');        // Replace multiple - with single -
};

// Helper to calculate read time
const calculateReadTime = (content: string) => {
  const wordsPerMinute = 200;
  // Quill content is HTML, so strip HTML tags for word count
  const cleanText = content.replace(/<\/?[^>]+(>|$)/g, "");
  const numberOfWords = cleanText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(numberOfWords / wordsPerMinute) || 1;
  return `${minutes} min read`;
};

export default function BlogsPage() {
  const { showSuccess, showError } = useToast();

  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string, title: string}>({isOpen: false, id: "", title: ""});
  
  const [newBlog, setNewBlog] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    image: "",
    category: "Wellness",
    author: "Jexmate Team",
    readTime: "5 min read",
    isActive: true
  });

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAdminBlogs();
      if (response.success) {
        setBlogs(response.data.blogs || response.data);
      }
    } catch (error) {
      console.error("Failed to load blogs:", error);
      showError("Failed to load blogs from backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  // Sync slug and readTime when title or content change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setNewBlog(prev => ({
      ...prev,
      title,
      slug: prev.slug === slugify(prev.title) || prev.slug === "" ? slugify(title) : prev.slug
    }));
  };

  const handleQuillContentChange = (content: string) => {
    setNewBlog(prev => ({
      ...prev,
      content,
      readTime: calculateReadTime(content)
    }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setNewBlog({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      image: "",
      category: "Wellness",
      author: localStorage.getItem("userName") || "Jexmate Team",
      readTime: "1 min read",
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (blog: any) => {
    setEditingId(blog._id);
    setNewBlog({
      title: blog.title || "",
      slug: blog.slug || "",
      excerpt: blog.excerpt || "",
      content: blog.content || "",
      image: blog.image || "",
      category: blog.category || "Wellness",
      author: blog.author || "Jexmate Team",
      readTime: blog.readTime || "5 min read",
      isActive: blog.isActive !== undefined ? blog.isActive : true
    });
    setIsModalOpen(true);
  };

  const handleCreateOrUpdate = async () => {
    if (!newBlog.title) { showError("Title is required"); return; }
    if (!newBlog.slug) { showError("Slug is required"); return; }
    if (!newBlog.excerpt) { showError("Excerpt is required"); return; }
    if (!newBlog.content) { showError("Content is required"); return; }
    if (!newBlog.category) { showError("Category is required"); return; }
    if (!newBlog.author) { showError("Author is required"); return; }

    setCreating(true);
    try {
      if (editingId) {
        await adminApi.updateBlog(editingId, newBlog);
        showSuccess("Blog updated successfully");
      } else {
        await adminApi.createBlog(newBlog);
        showSuccess("Blog created successfully");
      }
      setIsModalOpen(false);
      loadBlogs();
    } catch (error: any) {
      showError(getErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showError("Image exceeds the 5MB limit. Please upload a smaller image.");
      e.target.value = ""; // Clear input
      return;
    }

    setUploadingImage(true);
    try {
      const response = await adminApi.uploadAdminImage(file, "blogs");
      if (response.success && response.data?.url) {
        setNewBlog(prev => ({ ...prev, image: response.data.url }));
        showSuccess("Image uploaded successfully");
      }
    } catch (error) {
      showError("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const promptDelete = (id: string, title: string) => {
    setDeleteModal({ isOpen: true, id, title });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await adminApi.deleteBlog(deleteModal.id);
      showSuccess("Blog deleted successfully");
      setDeleteModal({ isOpen: false, id: "", title: "" });
      loadBlogs();
    } catch (error: any) {
      showError(getErrorMessage(error));
    }
  };

  const blogList = Array.isArray(blogs) ? blogs : [];

  return (
    <>
      <Header title="Blog Management" />
      
      <div className="p-8 max-w-6xl mx-auto animate-fade-in">
        <div className="glass-panel rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-[#0B132B]">All Blogs</h2>
            <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Blog
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Blog Info</th>
                  <th className="px-6 py-4">Slug & Category</th>
                  <th className="px-6 py-4">Author & Read Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading blogs...</td>
                  </tr>
                ) : blogList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No blogs found. Click Add Blog to create one.</td>
                  </tr>
                ) : (
                  blogList.map((blog) => (
                    <tr key={blog._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {blog.image ? (
                            <img src={blog.image} alt={blog.title} className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                          ) : (
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                              <FileText className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-slate-800 block leading-tight line-clamp-1">{blog.title}</span>
                            <span className="text-xs text-slate-400 leading-normal line-clamp-1 mt-0.5">{blog.excerpt}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded block w-fit mb-1">{blog.slug}</span>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">{blog.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-700 block text-xs">By {blog.author}</span>
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{blog.readTime}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                          blog.isActive 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {blog.isActive ? "Active" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(blog)} className="p-2 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-50 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => promptDelete(blog._id, blog.title)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-colors">
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

      {/* CREATE & EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-display font-semibold text-[#0B132B]">
                {editingId ? "Edit Blog Article" : "Create New Blog Article"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-semibold">✕</button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-left">
              {/* Image Upload Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-[#F8FAFC] p-4 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Cover Image</label>
                  <p className="text-[10px] text-slate-400">JPG, PNG or WEBP, max 5MB size.</p>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="blog-image-file" />
                  <label htmlFor="blog-image-file" className="btn-secondary py-2 px-3 text-xs w-fit flex items-center gap-1.5 cursor-pointer mt-2">
                    {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                    Upload Image
                  </label>
                </div>
                <div className="flex justify-center md:justify-end">
                  {newBlog.image ? (
                    <div className="relative group w-32 h-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                      <img src={newBlog.image} alt="Preview" className="w-full h-full object-cover" />
                      <button onClick={() => setNewBlog({...newBlog, image: ""})} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">Remove</button>
                    </div>
                  ) : (
                    <div className="w-32 h-20 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-300 text-slate-400 text-xs">No Image</div>
                  )}
                </div>
              </div>

              {/* Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Article Title</label>
                  <input
                    type="text"
                    value={newBlog.title}
                    onChange={handleTitleChange}
                    placeholder="e.g. 5 Habits for Immunity"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">SEO URL Slug</label>
                  <input
                    type="text"
                    value={newBlog.slug}
                    onChange={(e) => setNewBlog({...newBlog, slug: slugify(e.target.value)})}
                    placeholder="e.g. 5-habits-for-immunity"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Category, Author & Read Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Category</label>
                  <select
                    value={newBlog.category}
                    onChange={(e) => setNewBlog({...newBlog, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Wellness">Wellness</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Education">Education</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Author</label>
                  <input
                    type="text"
                    value={newBlog.author}
                    onChange={(e) => setNewBlog({...newBlog, author: e.target.value})}
                    placeholder="e.g. Dr. Jane Smith"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Read Time</label>
                  <input
                    type="text"
                    value={newBlog.readTime}
                    onChange={(e) => setNewBlog({...newBlog, readTime: e.target.value})}
                    placeholder="e.g. 5 min read"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Excerpt / Meta Description (SEO)</label>
                <textarea
                  value={newBlog.excerpt}
                  onChange={(e) => setNewBlog({...newBlog, excerpt: e.target.value})}
                  placeholder="Provide a short 1-2 sentence description summarizing the article."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Content */}
              <div className="space-y-1 quill-editor-wrapper">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Article Body (Rich Text)</label>
                <ReactQuill
                  theme="snow"
                  value={newBlog.content}
                  onChange={handleQuillContentChange}
                  placeholder="Write the full rich-text content of your article here..."
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                      ['link', 'image'],
                      ['clean']
                    ]
                  }}
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="blog-isActive-toggle"
                  checked={newBlog.isActive}
                  onChange={(e) => setNewBlog({...newBlog, isActive: e.target.checked})}
                  className="w-4 h-4 text-emerald-600 border-slate-200 rounded focus:ring-emerald-500"
                />
                <label htmlFor="blog-isActive-toggle" className="text-sm font-semibold text-slate-700 cursor-pointer">Publish Immediately (visible in search & index)</label>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#F8FAFC] border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreateOrUpdate} disabled={creating} className="btn-primary flex items-center gap-1.5">
                {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingId ? "Save Changes" : "Publish Article"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 text-left">
            <div className="p-6">
              <h3 className="text-lg font-display font-semibold text-[#0B132B] mb-2">Delete Blog Article</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Are you sure you want to permanently delete the article <strong>"{deleteModal.title}"</strong>? This action cannot be undone and will break the URL slug mapping.
              </p>
            </div>
            <div className="px-6 py-4 bg-[#F8FAFC] border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={() => setDeleteModal({ isOpen: false, id: "", title: "" })} className="btn-secondary">Cancel</button>
              <button onClick={confirmDelete} className="btn-danger bg-red-650 hover:bg-red-700 text-white text-xs font-semibold py-2.5 px-4 rounded-lg">Delete Article</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
