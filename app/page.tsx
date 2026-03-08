import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="cb-card">
        <h1 className="cb-card-title">Capital Bridge Advisory Platform</h1>
        <p className="cb-card-subtitle mt-2">
          Sign In Or Create An Account To Continue.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link href="/login" className="cb-btn-primary text-center">
            Log In
          </Link>
          <Link href="/signup" className="cb-link rounded-xl px-5 py-3 text-center">
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
