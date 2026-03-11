"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/pricing": "Choose Your Access Plan",
  "/login": "Client Access",
  "/signup": "Sign Up",
  "/dashboard": "Dashboard",
  "/advisory-platform": "Advisory Platform",
  "/payment-success": "Payment Success",
  "/forgot-password": "Forgot Password",
  "/reset-password": "Reset Password",
};

const PAGE_TITLES_MOBILE: Record<string, string> = {
  "/pricing": "ACCESS PLAN",
};

export function Header() {
  const pathname = usePathname() ?? "";
  const title = PAGE_TITLES[pathname] ?? "Capital Bridge";
  const titleMobile = PAGE_TITLES_MOBILE[pathname] ?? title;

  return (
    <header
      className="sticky top-0 z-20 border-b border-cb-cream/10 backdrop-blur-sm"
      style={{ backgroundColor: "#0D3A1D" }}
    >
      <div className="relative mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center focus:outline-none focus:ring-2 focus:ring-cb-gold focus:ring-offset-2 focus:ring-offset-[#0D3A1D] rounded"
        >
          <span className="block sm:hidden [&_img]:mix-blend-screen">
            <Image
              src="/logo-capital-bridge-mobile.png"
              alt="Capital Bridge"
              width={120}
              height={48}
              className="h-5 w-auto object-contain object-left"
              priority
            />
          </span>
          <Image
            src="/logo-capital-bridge.png"
            alt="Capital Bridge"
            width={180}
            height={48}
            className="hidden h-12 w-auto object-contain object-left sm:block"
            priority
          />
        </Link>
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-xs font-semibold sm:text-xl" style={{ color: "#F6F5F1" }}>
          <span className="sm:hidden">{titleMobile}</span>
          <span className="hidden sm:inline">{title}</span>
        </h1>
        <div className="flex shrink-0 items-center gap-1 text-xs sm:text-sm" style={{ color: "rgba(246,245,241,0.9)" }}>
          <a
            href="https://thecapitalbridge.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-cb-gold focus:outline-none focus:ring-2 focus:ring-cb-gold focus:ring-offset-2 focus:ring-offset-[#0D3A1D] rounded"
          >
            <span className="sm:hidden" aria-hidden>&lt;-</span>
            <span className="hidden sm:inline" aria-hidden>←</span>{" "}
            <span className="sm:hidden">Back</span>
            <span className="hidden sm:inline">Back to Platform</span>
          </a>
          <span style={{ color: "rgba(246,245,241,0.6)" }}>|</span>
          <Link
            href="/login"
            className="hover:text-cb-gold focus:outline-none focus:ring-2 focus:ring-cb-gold focus:ring-offset-2 focus:ring-offset-[#0D3A1D] rounded"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}
