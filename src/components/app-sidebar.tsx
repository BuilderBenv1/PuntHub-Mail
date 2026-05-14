"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/login/actions";

const navItems = [
  { title: "Dashboard", href: "/", icon: "📊" },
  { title: "Subscribers", href: "/subscribers", icon: "👥" },
  { title: "Lists", href: "/tags", icon: "🏷️" },
  { title: "Segments", href: "/segments", icon: "🔀" },
  { title: "Campaigns", href: "/campaigns", icon: "📧" },
  { title: "Automations", href: "/automations", icon: "⚡" },
  { title: "Templates", href: "/templates", icon: "📄" },
  { title: "Forms", href: "/forms", icon: "📝" },
  { title: "Landing Pages", href: "/landing-pages", icon: "🌐" },
  { title: "API Keys", href: "/api-keys", icon: "🔑" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/" className="text-xl font-bold" onClick={closeOnMobile}>
          PuntHub Mail
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href)
                    }
                  >
                    <Link href={item.href} onClick={closeOnMobile}>
                      <span>{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <form action={logout}>
          <Button variant="outline" className="w-full" type="submit">
            Sign out
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
