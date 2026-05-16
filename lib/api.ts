const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Helper for fetching with Auth
async function fetchWithAuth(url: string, options: RequestInit = {}, isFormData = false) {
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
  
  // Only set application/json if not FormData
  if (!isFormData) {
    headers.set("Content-Type", "application/json");
  }

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
    if (data.errors && data.errors.length > 0) {
      throw new Error(data.errors.join(", "));
    }
    throw new Error(data?.message || `HTTP error! status: ${response.status}`);
  }

  return data;
}

/** Dashboard APIs */
export const getAdminDashboard = () => fetchWithAuth("/admin/dashboard");

/** User APIs */
export const getAdminUsers = (query = "") => fetchWithAuth(`/admin/users${query ? `?${query}` : ""}`);
export const getAdminUser = (id: string) => fetchWithAuth(`/admin/users/${id}`);
export const getUserDetails = (id: string) => fetchWithAuth(`/admin/users/${id}/details`);
export const banUser = (id: string, reason: string) => fetchWithAuth(`/admin/users/${id}/ban`, { method: "POST", body: JSON.stringify({ reason }) });
export const unbanUser = (id: string) => fetchWithAuth(`/admin/users/${id}/unban`, { method: "POST" });
export const deleteUser = (id: string) => fetchWithAuth(`/admin/users/${id}`, { method: "DELETE" });

/** Profile APIs */
export const updateProfile = (data: any) => fetchWithAuth(`/users/me`, { method: "PUT", body: data }, true); // Uses FormData for avatar
export const updatePassword = (data: any) => fetchWithAuth(`/users/me/password`, { method: "PUT", body: JSON.stringify(data) });

/** Staff APIs */
export const getAdminStaff = (query = "") => fetchWithAuth(`/admin/staff${query ? `?${query}` : ""}`);
export const createStaff = (data: any) => fetchWithAuth("/admin/staff", { method: "POST", body: JSON.stringify(data) });
export const updateStaff = (id: string, data: any) => fetchWithAuth(`/admin/staff/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteStaff = (id: string) => fetchWithAuth(`/admin/staff/${id}`, { method: "DELETE" });

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

/** Assessment Questions APIs */
export const getAssessmentQuestions = () => fetchWithAuth("/admin/assessment-questions");
export const createAssessmentQuestion = (data: any) => fetchWithAuth("/admin/assessment-questions", { method: "POST", body: JSON.stringify(data) });
export const updateAssessmentQuestion = (id: string, data: any) => fetchWithAuth(`/admin/assessment-questions/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteAssessmentQuestion = (id: string) => fetchWithAuth(`/admin/assessment-questions/${id}`, { method: "DELETE" });
export const seedAssessmentQuestions = () => fetchWithAuth("/admin/assessment-questions/seed", { method: "POST" });

export const uploadAdminImage = (file: File, folder = "general") => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", folder);
  return fetchWithAuth("/admin/upload-image", {
    method: "POST",
    body: formData,
  }, true);
};

export const uploadAdminVideo = (file: File, folder = "products") => {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("folder", folder);
  return fetchWithAuth("/admin/upload-video", {
    method: "POST",
    body: formData,
  }, true);
};

export const getPendingDoctors = (query = "") => fetchWithAuth(`/admin/doctors/pending${query ? `?${query}` : ""}`);
export const getApprovedDoctors = (query = "") => fetchWithAuth(`/admin/doctors/approved${query ? `?${query}` : ""}`);
export const approveDoctor = (id: string) => fetchWithAuth(`/admin/doctors/${id}/approve`, { 
  method: "POST"
});
export const rejectDoctor = (id: string, reason: string) => fetchWithAuth(`/admin/doctors/${id}/reject`, {
  method: "POST",
  body: JSON.stringify({ reason })
});

/** Consultation APIs */
export const getAllConsultations = (query = "") => fetchWithAuth(`/admin/consultations${query ? `?${query}` : ""}`);
export const getConsultationById = (id: string) => fetchWithAuth(`/admin/consultations/${id}`);

/** Self-Test APIs */
export const getAllSelfTests = (query = "") => fetchWithAuth(`/admin/self-tests${query ? `?${query}` : ""}`);
export const getSelfTestById = (id: string) => fetchWithAuth(`/admin/self-tests/${id}`);
export const getUserSelfTests = (userId: string) => fetchWithAuth(`/admin/self-tests/user/${userId}`);

/** Prescription Review APIs */
export const getPrescriptionOrders = (query = "") => fetchWithAuth(`/admin/prescriptions${query ? `?${query}` : ""}`);
export const getPrescriptionOrder = (id: string) => fetchWithAuth(`/admin/prescriptions/${id}`);
export const reviewPrescription = (id: string, action: 'approve' | 'reject', note?: string) =>
  fetchWithAuth(`/admin/prescriptions/${id}/review`, { method: "PUT", body: JSON.stringify({ action, note }) });

/** Pharmacy User Management APIs */
export const createPharmacyUser = (data: { phone: string; password: string; name: string; email?: string }) =>
  fetchWithAuth("/admin/users/create-pharmacy", { method: "POST", body: JSON.stringify(data) });
export const updateUserRole = (userId: string, role: string) =>
  fetchWithAuth(`/admin/users/${userId}/role`, { method: "PUT", body: JSON.stringify({ role }) });

/** Coupon APIs */
export const getCoupons = (query = "") => fetchWithAuth(`/admin/coupons${query ? `?${query}` : ""}`);
export const getCouponById = (id: string) => fetchWithAuth(`/admin/coupons/${id}`);
export const createCoupon = (data: any) => fetchWithAuth("/admin/coupons", { method: "POST", body: JSON.stringify(data) });
export const updateCoupon = (id: string, data: any) => fetchWithAuth(`/admin/coupons/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteCoupon = (id: string) => fetchWithAuth(`/admin/coupons/${id}`, { method: "DELETE" });

/** Product Review APIs */
export const getAdminReviews = (query = "") => fetchWithAuth(`/admin/reviews${query ? `?${query}` : ""}`);
export const updateReviewStatus = (id: string, action: "approve" | "reject") =>
  fetchWithAuth(`/admin/reviews/${id}/status`, { method: "PUT", body: JSON.stringify({ action }) });
export const deleteReview = (id: string) => fetchWithAuth(`/admin/reviews/${id}`, { method: "DELETE" });
export const addAdminReview = (data: { productId: string; rating: number; title?: string; body: string }) =>
  fetchWithAuth("/admin/reviews", { method: "POST", body: JSON.stringify(data) });

export const adminApi = {
  getAdminDashboard,
  getAdminUsers, getAdminUser, getUserDetails, banUser, unbanUser, deleteUser,
  updateProfile, updatePassword,
  getAdminStaff, createStaff, updateStaff, deleteStaff,
  createPharmacyUser, updateUserRole,
  getPendingDoctors, getApprovedDoctors, approveDoctor, rejectDoctor,
  getAdminProducts, getAdminProduct, createProduct, updateProduct, deleteProduct, updateProductStock, bulkUpdateProductStatus,
  getAdminCategories, createCategory, updateCategory, deleteCategory,
  getAdminSubCategories, createSubCategory, updateSubCategory, deleteSubCategory,
  getAdminOrders, getAdminOrder, updateOrderStatus, addOrderNote,
  getAdminSettings, updateSetting,
  getAssessmentQuestions, createAssessmentQuestion, updateAssessmentQuestion, deleteAssessmentQuestion, seedAssessmentQuestions,
  uploadAdminImage,
  uploadAdminVideo,
  getAllConsultations, getConsultationById,
  getAllSelfTests, getSelfTestById, getUserSelfTests,
  getPrescriptionOrders, getPrescriptionOrder, reviewPrescription,
  getCoupons, getCouponById, createCoupon, updateCoupon, deleteCoupon,
  getAdminReviews, updateReviewStatus, deleteReview, addAdminReview,
};

