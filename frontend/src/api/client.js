const BASE_URL = "http://127.0.0.1:8000/api";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Token ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
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

  listExcipients: ({ category, search, grade, page, ordering } = {}) => {
    const params = [];
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (grade) params.push(`grade=${encodeURIComponent(grade)}`);
    if (page) params.push(`page=${page}`);
    if (ordering) params.push(`ordering=${encodeURIComponent(ordering)}`);
    return request(`/excipients/${params.length ? `?${params.join("&")}` : ""}`);
  },
  createExcipient: (payload, token) =>
    request("/excipients/", { method: "POST", body: payload, token }),

  updateProfile: (payload, token) =>
    request("/auth/me/", { method: "PATCH", body: payload, token }),

  listAddresses: (token) => request("/addresses/", { token }),
  createAddress: (payload, token) =>
    request("/addresses/", { method: "POST", body: payload, token }),

  listOrders: (token) => request("/orders/", { token }),
  createOrder: (payload, token) =>
    request("/orders/", { method: "POST", body: payload, token }),
  raiseOrderDispute: (orderId, payload, token) =>
    request(`/orders/${orderId}/raise-dispute/`, { method: "POST", body: payload, token }),

  listMyExcipients: (token) => request("/excipients/?my=true", { token }),
  listSellerOrderItems: (token) => request("/seller-order-items/", { token }),
  updateSellerOrderItem: (id, payload, token) =>
    request(`/seller-order-items/${id}/`, { method: "PATCH", body: payload, token }),

  getExcipient: (id) => request(`/excipients/${id}/`),
  updateExcipient: (id, payload, token) =>
    request(`/excipients/${id}/`, { method: "PATCH", body: payload, token }),

  confirmDelivery: (orderId, token) =>
    request(`/orders/${orderId}/confirm-delivery/`, { method: "POST", token }),

  updateAddress: (id, payload, token) =>
    request(`/addresses/${id}/`, { method: "PATCH", body: payload, token }),
  deleteAddress: (id, token) =>
    request(`/addresses/${id}/`, { method: "DELETE", token }),

  adminPendingSellers: (token) => request("/admin/sellers/", { token }),
  adminVerifySeller: (id, action, token) =>
    request(`/admin/sellers/${id}/verify/`, { method: "POST", body: { action }, token }),
  adminDisputes: (token) => request("/admin/disputes/", { token }),
  adminResolveDispute: (id, outcome, resolution, token) =>
    request(`/admin/disputes/${id}/resolve/`, { method: "POST", body: { outcome, resolution }, token }),
  adminUsers: (role, token) => request(`/admin/users/${role ? `?role=${role}` : ""}`, { token }),
};
