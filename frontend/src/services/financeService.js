import { apiRequest } from "./api.js";

// The backend has no pagination configured, so lists are plain arrays.
// `results` is handled too in case pagination is enabled later.
const toList = (data) => (Array.isArray(data) ? data : (data?.results ?? []));

export const listAccounts = async () => toList(await apiRequest("/api/accounts/"));

export const createAccount = (payload) =>
  apiRequest("/api/accounts/", { method: "POST", body: payload });

export const listCategories = async () =>
  toList(await apiRequest("/api/categories/"));

export const createCategory = (payload) =>
  apiRequest("/api/categories/", { method: "POST", body: payload });

export const listTransactions = async () =>
  toList(await apiRequest("/api/transactions/"));

export const createTransaction = (payload) =>
  apiRequest("/api/transactions/", { method: "POST", body: payload });

export const updateAccount = (id, payload) =>
  apiRequest(`/api/accounts/${id}/`, { method: "PATCH", body: payload });

export const deleteAccount = (id) =>
  apiRequest(`/api/accounts/${id}/`, { method: "DELETE" });

export const updateTransaction = (id, payload) =>
  apiRequest(`/api/transactions/${id}/`, { method: "PATCH", body: payload });

export const deleteTransaction = (id) =>
  apiRequest(`/api/transactions/${id}/`, { method: "DELETE" });
