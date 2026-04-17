import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeById } from "@/lib/queries";
import type { Employee } from "@/lib/types";

export const metadata: Metadata = {
  title: "Thanks Card - サンクスカード",
  description: "感謝を届けよう。鮑屋グループ サンクスカード",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "サンクスカード",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialUser: Employee | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.app_metadata?.employee_id) {
      initialUser = await getEmployeeById(user.app_metadata.employee_id);
    }
  } catch {
    // Auth check failed — continue with null user
  }

  return (
    <html lang="ja">
      <body className="min-h-screen bg-[var(--color-bg)]">
        <AuthProvider initialUser={initialUser}>{children}</AuthProvider>
      </body>
    </html>
  );
}
