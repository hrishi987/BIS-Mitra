import type { Metadata } from "next";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SessionProvider } from "@/lib/store";

import "./globals.css";

export const metadata: Metadata = {
  title: "BIS Mitra — Indian Standards intelligence, made understandable.",
  description:
    "An AI-powered assistant for industries and consumers to navigate Indian Standards and BIS services.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans">
        <SessionProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
