import { apiRequest } from "./api.js";

const AUTH_BASE = "/api/users/auth";

/** Step 1: ask the backend to send an OTP to a mobile number or email. */
export function requestOtp(identifier) {
  return apiRequest(`${AUTH_BASE}/otp/request/`, {
    method: "POST",
    body: { identifier },
  });
}

/** Step 2: verify the code. On success Django sets the session cookie. */
export function verifyOtp(identifier, code) {
  return apiRequest(`${AUTH_BASE}/otp/verify/`, {
    method: "POST",
    body: { identifier, code },
  });
}

/** Returns the logged-in user ({ id, phone, email }) or throws a 403. */
export function getCurrentUser() {
  return apiRequest(`${AUTH_BASE}/me/`);
}

/** Ends the session on the server (apiRequest adds the CSRF header). */
export function logout() {
  return apiRequest(`${AUTH_BASE}/logout/`, { method: "POST" });
}
