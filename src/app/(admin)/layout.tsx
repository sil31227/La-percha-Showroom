import type { Metadata, Viewport } from "next";
import "./admin.css";
import { AdminSidebar } from "./sidebar";
import { NotificationsInitializer } from "@/components/NotificationsInitializer";

export const metadata: Metadata = {
  title: "Panel Admin — La Percha Showroom",
  robots: "noindex",
  manifest: "/admin-manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "La Percha Admin" },
};
export const viewport: Viewport = {
  themeColor: "#f8f6f2", width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg-page">
      <AdminSidebar />
      <main className="flex-1 lg:pl-56 pt-12 pb-16 lg:pt-0 lg:pb-0 overflow-x-hidden">{children}</main>
      <NotificationsInitializer />
    </div>
  );
}
