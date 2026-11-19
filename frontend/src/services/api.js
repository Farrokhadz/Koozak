// Empty = same origin. In development Vite proxies /api to Django (see
// vite.config.js), which avoids CORS and CSRF-origin problems. In production,
// set VITE_API_BASE_URL only if the API lives on a different origin.
const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? ""
).replace(/\/$/, "");

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getCookie(name) {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

/** Flattens the different error shapes DRF / our views return into one string. */
function extractMessage(data) {
  if (!data) return null;
  if (typeof data === "string") return data;
  if (Array.isArray(data)) {
    return data.map(extractMessage).filter(Boolean).join(" ") || null;
  }
  if (typeof data === "object") {
    if (data.error) return extractMessage(data.error);
    if (data.detail) return extractMessage(data.detail);
    return (
      Object.values(data).map(extractMessage).filter(Boolean).join(" ") || null
    );
  }
  return null;
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
    const raw = extractMessage(data);
    let message = raw ?? "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.";
    if (response.status === 403 && /csrf/i.test(raw ?? "")) {
      message =
        "درخواست توسط سرور رد شد (خطای CSRF). تنظیم CSRF_TRUSTED_ORIGINS در بک‌اند را بررسی کنید.";
    }
    throw new ApiError(message, response.status, data);
  }

  return data;
}
