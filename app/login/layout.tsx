import { Suspense } from "react";

export const dynamic = "force-dynamic";

function LoginFallback() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="cb-card">
        <h1 className="cb-card-title">Capital Bridge Advisory Platform</h1>
        <p className="mt-6 text-center text-sm text-cb-green/80">Loading…</p>
      </div>
    </main>
  );
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<LoginFallback />}>{children}</Suspense>;
}
