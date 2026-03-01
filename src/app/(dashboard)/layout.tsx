import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/toaster";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background px-4 py-2 md:hidden">
            <SidebarTrigger />
            <span className="font-semibold">PuntHub Mail</span>
          </div>
          <div className="p-3 sm:p-4 md:p-6">{children}</div>
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
