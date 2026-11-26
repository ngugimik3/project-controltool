"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { isNavItemActive, navHref, type NavItem } from "@/lib/navigation";

export function NavMain({
  groups,
  projectId,
}: {
  groups: { label: string; items: NavItem[] }[];
  projectId?: string | null;
}) {
  const pathname = usePathname();

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label} className="py-1.5">
          {group.label !== "Main" ? (
            <SidebarGroupLabel className="mb-1 h-7 px-3 text-[10.5px] font-semibold tracking-[0.08em] text-white/70 uppercase">
              {group.label}
            </SidebarGroupLabel>
          ) : null}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isNavItemActive(item, pathname, projectId)}
                      tooltip={item.label}
                      className="px-3"
                    >
                      <Link href={navHref(item, projectId)}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
