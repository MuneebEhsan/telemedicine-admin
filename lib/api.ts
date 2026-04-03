const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Helper for fetching with Auth
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Try to get token from localStorage first if we are on the client
  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("adminToken");
    
    // Redirect immediately if there's no token
    if (!token && window.location.pathname !== '/login') {
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
  }

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || `HTTP error! status: ${response.status}`);
  }

  return data;
}

/** Dashboard APIs */
export const getAdminDashboard = () => fetchWithAuth("/admin/dashboard");

/** User APIs */
export const getAdminUsers = (query = "") => fetchWithAuth(`/admin/users${query ? `?${query}` : ""}`);
export const getAdminUser = (id: string) => fetchWithAuth(`/admin/users/${id}`);
export const banUser = (id: string, reason: string) => fetchWithAuth(`/admin/users/${id}/ban`, { method: "POST", body: JSON.stringify({ reason }) });
export const unbanUser = (id: string) => fetchWithAuth(`/admin/users/${id}/unban`, { method: "POST" });

/** Product APIs */
export const getAdminProducts = (query = "") => fetchWithAuth(`/admin/products${query ? `?${query}` : ""}`);
export const getAdminProduct = (id: string) => fetchWithAuth(`/admin/products/${id}`);
export const createProduct = (data: any) => fetchWithAuth("/admin/products", { method: "POST", body: JSON.stringify(data) });
export const updateProduct = (id: string, data: any) => fetchWithAuth(`/admin/products/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteProduct = (id: string) => fetchWithAuth(`/admin/products/${id}`, { method: "DELETE" });
export const updateProductStock = (id: string, stock: number) => fetchWithAuth(`/admin/products/${id}/stock`, { method: "PATCH", body: JSON.stringify({ stock }) });
export const bulkUpdateProductStatus = (productIds: string[], status: string) => fetchWithAuth("/admin/products/bulk-status", { method: "PATCH", body: JSON.stringify({ productIds, status }) });

/** Category APIs */
export const getAdminCategories = () => fetchWithAuth("/admin/categories");
export const createCategory = (data: any) => fetchWithAuth("/admin/categories", { method: "POST", body: JSON.stringify(data) });
export const updateCategory = (id: string, data: any) => fetchWithAuth(`/admin/categories/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteCategory = (id: string) => fetchWithAuth(`/admin/categories/${id}`, { method: "DELETE" });

/** Subcategory APIs */
export const getAdminSubCategories = () => fetchWithAuth("/admin/subcategories");
export const createSubCategory = (data: any) => fetchWithAuth("/admin/subcategories", { method: "POST", body: JSON.stringify(data) });
export const updateSubCategory = (id: string, data: any) => fetchWithAuth(`/admin/subcategories/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteSubCategory = (id: string) => fetchWithAuth(`/admin/subcategories/${id}`, { method: "DELETE" });

/** Order APIs */
export const getAdminOrders = (query = "") => fetchWithAuth(`/admin/orders${query ? `?${query}` : ""}`);
export const getAdminOrder = (id: string) => fetchWithAuth(`/admin/orders/${id}`);
export const updateOrderStatus = (id: string, status: string, note?: string) => fetchWithAuth(`/admin/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status, note }) });
export const addOrderNote = (id: string, note: string) => fetchWithAuth(`/admin/orders/${id}/note`, { method: "PUT", body: JSON.stringify({ note }) });

/** Settings APIs */
export const getAdminSettings = () => fetchWithAuth("/admin/settings");
export const updateSetting = (key: string, value: any, description?: string) => fetchWithAuth(`/admin/settings/${key}`, { method: "PUT", body: JSON.stringify({ value, description }) });

export const uploadAdminImage = async (file: File, folder: string = "general") => {
  const formData = new FormData();
  formData.append("image", file);
  if (folder) formData.append("folder", folder);

  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("adminToken");
  }

  const response = await fetch(`${API_BASE_URL}/admin/upload-image`, {
    method: "POST",
    headers: token ? { "Authorization": `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
     const data = await response.json();
     throw new Error(data?.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const adminApi = {
  getAdminDashboard,
  getAdminUsers, getAdminUser, banUser, unbanUser,
  getAdminProducts, getAdminProduct, createProduct, updateProduct, deleteProduct, updateProductStock, bulkUpdateProductStatus,
  getAdminCategories, createCategory, updateCategory, deleteCategory,
  getAdminSubCategories, createSubCategory, updateSubCategory, deleteSubCategory,
  getAdminOrders, getAdminOrder, updateOrderStatus, addOrderNote,
  getAdminSettings, updateSetting,
  uploadAdminImage
};
