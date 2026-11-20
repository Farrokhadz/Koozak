import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import HelpPage from "./pages/HelpPage.jsx";
import SiteFooter from "./components/layout/SiteFooter.jsx";
import { getCurrentUser, logout } from "./services/authService.js";

// Help routes live in the URL hash, so no router library is needed. Each one
// opens the Help page and scrolls to the named section.
const HELP_ROUTES = { help: undefined, contact: "contact", about: "about" };
const readRoute = () => window.location.hash.replace(/^#/, "");

// Same page shell everywhere so the footer is always reachable.
const withFooter = (page) => (
  <div className="flex min-h-screen flex-col bg-background">
    <div className="flex flex-1 flex-col">{page}</div>
    <SiteFooter />
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const sync = () => setRoute(readRoute());
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  const closeHelp = () => {
    window.history.pushState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    setRoute("");
  };

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

  if (Object.prototype.hasOwnProperty.call(HELP_ROUTES, route)) {
    return withFooter(
      <HelpPage section={HELP_ROUTES[route]} onBack={closeHelp} />,
    );
  }

  if (checking) {
    return <main className="min-h-screen bg-background" />;
  }

  if (!user) {
    return withFooter(<LoginPage onLogin={setUser} />);
  }

  return withFooter(
    <DashboardPage
      user={user}
      onLogout={handleLogout}
      loggingOut={loggingOut}
      logoutError={logoutError}
    />,
  );
}
