import NavbarWrapper from "@/components/NavbarWrapper";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { AuthInitializer } from "@/components/AuthInitializer";
import { NotificationsInitializer } from "@/components/NotificationsInitializer";

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-page flex flex-col lg:pt-16">
      <AuthInitializer />
      <NotificationsInitializer />

      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <NavbarWrapper />
      <WhatsAppButton />
    </div>
  );
}
