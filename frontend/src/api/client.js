const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

async function request(path, { method = "GET", body, token, isForm = false } = {}) {
  const headers = {};
  if (token) headers["Authorization"] = `Token ${token}`;
  if (!isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message =
      (data && (data.detail || JSON.stringify(data))) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register/", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login/", { method: "POST", body: payload }),
  me: (token) => request("/auth/me/", { token }),

  // Catalog + batches
  listExcipients: ({ category, search, grade, page, ordering } = {}) => {
    const params = [];
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (grade) params.push(`grade=${encodeURIComponent(grade)}`);
    if (page) params.push(`page=${page}`);
    if (ordering) params.push(`ordering=${encodeURIComponent(ordering)}`);
    return request(`/excipients/${params.length ? `?${params.join("&")}` : ""}`);
  },
  getExcipient: (id) => request(`/excipients/${id}/`),
  createExcipient: (payload, token) =>
    request("/excipients/", { method: "POST", body: payload, token }),
  updateExcipient: (id, payload, token) =>
    request(`/excipients/${id}/`, { method: "PATCH", body: payload, token }),

  listBatches: ({ excipient, my } = {}) => {
    const params = [];
    if (excipient) params.push(`excipient=${excipient}`);
    if (my) params.push(`my=true`);
    return request(`/batches/${params.length ? `?${params.join("&")}` : ""}`);
  },
  createBatch: (payload, token) =>
    request("/batches/", { method: "POST", body: payload, token }),
  updateBatch: (id, payload, token) =>
    request(`/batches/${id}/`, { method: "PATCH", body: payload, token }),
  deleteBatch: (id, token) => request(`/batches/${id}/`, { method: "DELETE", token }),

  // Documents
  listDocuments: (params = {}) => {
    const q = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    return request(`/documents/${q ? `?${q}` : ""}`);
  },
  uploadDocument: (formData, token) =>
    request("/documents/", { method: "POST", body: formData, token, isForm: true }),
  verifyDocument: (id, token) =>
    request(`/documents/${id}/verify/`, { method: "POST", token }),
  rejectDocument: (id, token) =>
    request(`/documents/${id}/reject/`, { method: "POST", token }),

  // Supplier verification
  listSupplierVerifications: (token) => request("/supplier-verifications/", { token }),
  getMyVerification: (token) => request("/supplier-verifications/", { token }),
  approveVerification: (id, payload, token) =>
    request(`/supplier-verifications/${id}/approve/`, { method: "POST", body: payload, token }),
  requestInfoVerification: (id, payload, token) =>
    request(`/supplier-verifications/${id}/request-info/`, { method: "POST", body: payload, token }),
  rejectVerification: (id, payload, token) =>
    request(`/supplier-verifications/${id}/reject/`, { method: "POST", body: payload, token }),

  // RFQ + quotes
  listRFQs: (params = {}) => {
    const q = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    return request(`/rfqs/${q ? `?${q}` : ""}`);
  },
  createRFQ: (payload, token) => request("/rfqs/", { method: "POST", body: payload, token }),
  getRFQ: (id, token) => request(`/rfqs/${id}/`, { token }),
  listRFQQuotes: (rfqId, token) =>
    request(`/rfqs/${rfqId}/quotes/`, { token }),
  createRFQQuote: (rfqId, payload, token) =>
    request(`/rfqs/${rfqId}/quotes/`, { method: "POST", body: payload, token }),
  acceptQuote: (quoteId, token) =>
    request(`/rfq-quotes/${quoteId}/accept/`, { method: "POST", token }),
  closeRFQ: (rfqId, token) => request(`/rfqs/${rfqId}/close/`, { method: "POST", token }),

  // Formulation kits + saved products
  listFormulationKits: (token) => request("/formulation-kits/", { token }),
  createFormulationKit: (payload, token) =>
    request("/formulation-kits/", { method: "POST", body: payload, token }),
  updateFormulationKit: (id, payload, token) =>
    request(`/formulation-kits/${id}/`, { method: "PATCH", body: payload, token }),
  deleteFormulationKit: (id, token) =>
    request(`/formulation-kits/${id}/`, { method: "DELETE", token }),
  kitAvailability: (id, token) =>
    request(`/formulation-kits/${id}/availability/`, { token }),
  toggleSavedProduct: (excipientId, token) =>
    request("/saved-products/toggle/", { method: "POST", body: { excipient: excipientId }, token }),
  listSavedProducts: (token) => request("/saved-products/", { token }),

  // Notifications
  listNotifications: (token) => request("/notifications/", { token }),
  markNotificationRead: (id, token) =>
    request(`/notifications/${id}/read/`, { method: "POST", token }),
  markAllNotificationsRead: (token) =>
    request("/notifications/read-all/", { method: "POST", token }),

  // Messages
  listMessages: (token) => request("/messages/", { token }),
  sendMessage: (payload, token) => request("/messages/", { method: "POST", body: payload, token }),
  markMessageRead: (id, token) => request(`/messages/${id}/read/`, { method: "POST", token }),

  // Orders (buyer + seller)
  listOrders: (token) => request("/orders/", { token }),
  createOrder: (payload, token) =>
    request("/orders/", { method: "POST", body: payload, token }),
  raiseOrderDispute: (orderId, payload, token) =>
    request(`/orders/${orderId}/raise-dispute/`, { method: "POST", body: payload, token }),
  payOrder: (orderId, token) =>
    request(`/orders/${orderId}/pay/`, { method: "POST", token }),
  createReview: (payload, token) =>
    request("/reviews/", { method: "POST", body: payload, token }),
  listMyReviews: (token) => request("/reviews/", { token }),
  adminReviews: (token) => request("/admin/reviews/", { token }),
  deleteReview: (id, token) =>
    request(`/admin/reviews/${id}/`, { method: "DELETE", token }),
  confirmDelivery: (orderId, token) =>
    request(`/orders/${orderId}/confirm-delivery/`, { method: "POST", token }),

  listSellerOrderItems: (token) => request("/seller-order-items/", { token }),
  listSellerOrders: (token) => request("/seller-orders/", { token }),
  setOrderStatus: (orderId, status, token) =>
    request(`/seller-orders/${orderId}/set-status/`, { method: "POST", body: { status }, token }),

  // Addresses
  listAddresses: (token) => request("/addresses/", { token }),
  createAddress: (payload, token) =>
    request("/addresses/", { method: "POST", body: payload, token }),
  updateAddress: (id, payload, token) =>
    request(`/addresses/${id}/`, { method: "PATCH", body: payload, token }),
  deleteAddress: (id, token) => request(`/addresses/${id}/`, { method: "DELETE", token }),

  // Admin
  adminPendingSellers: (token) => request("/admin/sellers/", { token }),
  adminVerifySeller: (id, action, token) =>
    request(`/admin/sellers/${id}/verify/`, { method: "POST", body: { action }, token }),
  adminDisputes: (token) => request("/admin/disputes/", { token }),
  adminResolveDispute: (id, outcome, resolution, token) =>
    request(`/admin/disputes/${id}/resolve/`, { method: "POST", body: { outcome, resolution }, token }),
  adminUsers: (role, token) => request(`/admin/users/${role ? `?role=${role}` : ""}`, { token }),
  adminCompliance: (token) => request("/admin/compliance/", { token }),
  adminAuditLogs: (token) => request("/audit-logs/", { token }),
};
