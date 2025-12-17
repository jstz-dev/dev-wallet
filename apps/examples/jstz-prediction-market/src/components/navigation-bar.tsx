"use client";

import { cn } from "jstz-ui/utils";
import { SquarePlus, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

const navigation = [
  { name: "Markets", href: "/markets", icon: TrendingUp },
  { name: "Deploy", href: "/deploy", icon: SquarePlus },
];

export default function NavigationBar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 px-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="size-5 text-primary-foreground" />
          </div>

          <span className="text-lg font-semibold text-sidebar-foreground">TezMarket</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((nav) => {
                const isActive = pathname === nav.href;

                return (
                  <SidebarMenuItem key={nav.href}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Link href={nav.href}>
                        <nav.icon />
                        <span>{nav.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
