import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Capital Bridge Advisory Platform",
  description: "Capital Bridge authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ backgroundColor: "#0d3a1d", color: "#0d3a1d" }}>
      <body
        style={{
          backgroundColor: "#0d3a1d",
          color: "#0d3a1d",
          minHeight: "100vh",
          margin: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
