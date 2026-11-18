const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getCookie(name) {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

/**
 * Thin wrapper around fetch for the Koozak Django API.
 * - Always sends cookies (`credentials: "include"`) so the session works.
 * - Sends the CSRF token (if the cookie exists) on unsafe methods.
 * - Throws ApiError with a user-facing Persian message.
 */
export async function apiRequest(path, { method = "GET", body } = {}) {
  const headers = { Accept: "application/json" };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (!SAFE_METHODS.includes(method)) {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) headers["X-CSRFToken"] = csrfToken;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.",
      0,
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Empty or non-JSON body (e.g. an HTML 500 page) – handled below.
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error ?? data?.detail ?? "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
      response.status,
    );
  }

  return data;
}
