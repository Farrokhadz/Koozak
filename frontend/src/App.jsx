import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import { getCurrentUser } from "./services/authService.js";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

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
        <p className="text-sm font-medium text-secondary">کوژک</p>
        <h1 className="mt-2 text-2xl font-bold text-primary">خوش آمدید</h1>
        <p dir="ltr" className="mt-4 text-text/70">
          {user.phone ?? user.email}
        </p>
      </section>
    </main>
  );
}
