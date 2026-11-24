"use client";

import Link from "next/link";
import { ChevronsUpDown, LogOut, UserRound } from "lucide-react";
import { Avatar } from "@/components/profile/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { logoutAction } from "@/lib/actions/auth";
import { ROLE_LABEL, type Role } from "@/lib/roles";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    username: string;
    avatarUrl: string | null;
    role: Role;
  };
}) {
  const { isMobile } = useSidebar();
  const secondary = user.username ? `@${user.username}` : ROLE_LABEL[user.role];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={user.name}
              className="h-12 rounded-xl border border-white/15 bg-white/10 px-2 hover:bg-white/16 data-active:bg-white/10 data-active:text-sidebar-foreground data-active:shadow-none"
            >
              <Avatar name={user.name} avatarUrl={user.avatarUrl} size={30} />
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium text-white">{user.name}</span>
                <span className="truncate text-xs text-white/65">{secondary}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-white/60 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar name={user.name} avatarUrl={user.avatarUrl} size={32} />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {secondary}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserRound />
                  Profile
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={logoutAction} className="w-full">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 text-left"
                >
                  <LogOut />
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
