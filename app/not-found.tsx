import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="cb-card">
        <h1 className="cb-card-title">Page Not Found</h1>
        <p className="cb-card-subtitle mt-2">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link href="/" className="cb-btn-primary text-center">
            Go Home
          </Link>
          <Link href="/login" className="cb-link rounded-xl px-5 py-3 text-center">
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}
