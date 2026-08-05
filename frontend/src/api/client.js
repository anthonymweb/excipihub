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

  listExcipients: ({ category, search } = {}) => {
    const params = [];
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
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
};
