import { NextRequest } from "next/server";
const SHARED = {
  display: "standalone" as const, background_color: "#faf7f2", theme_color: "#faf7f2",
  icons: [
    { src: "/logo.jpg", sizes: "192x192", type: "image/jpeg" as const },
    { src: "/logo.jpg", sizes: "512x512", type: "image/jpeg" as const },
  ],
};
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("for") === "admin") {
    return Response.json({ name: "La Percha Admin", short_name: "Admin", start_url: "/admin/dashboard", ...SHARED });
  }
  return Response.json({ name: "La Percha Showroom", short_name: "La Percha", description: "Tienda Oficial + Feria de Ropa", start_url: "/", ...SHARED });
}
