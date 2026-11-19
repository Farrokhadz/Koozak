import LoginForm from "../components/auth/LoginForm.jsx";
import InstallAppButton from "../components/ui/InstallAppButton.jsx";

export default function LoginPage({ onLogin }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary">کوزک</h1>
          <p className="mt-2 text-sm text-text/70">مدیریت مالی شخصی</p>
          <div className="mx-auto mt-4 h-1.5 w-16 rounded-full bg-accent" />
        </header>

        <section className="rounded-3xl bg-surface p-6 shadow-sm sm:p-8">
          <LoginForm onSuccess={onLogin} />
        </section>

        <div className="mt-6 flex justify-center">
          <InstallAppButton />
        </div>
      </div>
    </main>
  );
}
