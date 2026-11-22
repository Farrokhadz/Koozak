import LoginForm from "../components/auth/LoginForm.jsx";
import InstallAppButton from "../components/ui/InstallAppButton.jsx";
import { panel } from "../components/ui/styles.js";

export default function LoginPage({ onLogin }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-primary">کوزک</h1>
          <p className="mt-1.5 text-sm text-text/50">مدیریت مالی شخصی</p>
        </header>

        <section className={`${panel} p-6`}>
          <LoginForm onSuccess={onLogin} />
        </section>

        <div className="mt-5 flex justify-center">
          <InstallAppButton />
        </div>
      </div>
    </main>
  );
}
