import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ReadStatusProvider } from "@/lib/read-status";

export const metadata: Metadata = {
  title: "Thanks Card - サンクスカード",
  description: "感謝を届けよう。鮑屋グループ サンクスカード",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-[var(--color-bg)]">
        <AuthProvider>
          <ReadStatusProvider>{children}</ReadStatusProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
