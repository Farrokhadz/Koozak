import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
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

  return (
    <DashboardPage
      user={user}
      onLogout={handleLogout}
      loggingOut={loggingOut}
      logoutError={logoutError}
    />
  );
}
