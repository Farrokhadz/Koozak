import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import { getCurrentUser, logout } from "./services/authService.js";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await logout();
      setUser(null); // back to the login page
    } catch (err) {
      setLogoutError(err.message);
    } finally {
      setLoggingOut(false);
    }
  };

  // If a valid session cookie already exists, skip the login screen.
  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return <main className="min-h-screen bg-background" />;
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  // Temporary placeholder until the dashboard is built.
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-3xl bg-surface p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-secondary">کوزک</p>
        <h1 className="mt-2 text-2xl font-bold text-primary">خوش آمدید</h1>
        <p dir="ltr" className="mt-4 text-text/70">
          {user.phone ?? user.email}
        </p>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-6 w-full rounded-2xl border border-primary/30 px-6 py-3 font-bold text-primary transition hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loggingOut ? "در حال خروج..." : "خروج از حساب"}
        </button>
        {logoutError && (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {logoutError}
          </p>
        )}
      </section>
    </main>
  );
}
