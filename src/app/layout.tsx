import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ variable: "--font-display", subsets: ["latin"], weight: ["400","500","600","700"] });
const inter = Inter({ variable: "--font-ui", subsets: ["latin"], weight: ["300","400","500","600"] });

export const metadata: Metadata = {
  title: "La Percha Showroom", description: "Moda Circular · Comunidad · Confianza",
  manifest: "/api/manifest",
  icons: { icon: "/logo.jpg", apple: "/logo.jpg" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "La Percha" },
  openGraph: {
    title: "La Percha Showroom",
    description: "Moda Circular · Comunidad · Confianza",
    siteName: "La Percha Showroom",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "La Percha Showroom" }],
    type: "website",
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: "La Percha Showroom",
    description: "Moda Circular · Comunidad · Confianza",
    images: ["/og-image.jpg"],
  },
};
export const viewport: Viewport = {
  themeColor: "#f8f6f2", width: "device-width", initialScale: 1, maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-bg-page text-text-body font-ui">{children}</body>
    </html>
  );
}
