"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export type NavSecondaryItem = {
  title: string
  url: string
  icon: React.ReactNode
  /** Optional trailing content, e.g. an unread count. Hidden when collapsed. */
  badge?: React.ReactNode
  /** Open in a new tab. Defaults to true for absolute http(s) URLs. */
  external?: boolean
  /** Only mark the item active on an exact path match. */
  exact?: boolean
  /** Force the active state, overriding path-based detection. */
  isActive?: boolean
  disabled?: boolean
  onSelect?: () => void
}

function isExternalUrl(url: string): boolean {
  return !url.startsWith("/") && !url.startsWith("#")
}

function isItemActive(item: NavSecondaryItem, pathname: string): boolean {
  if (item.isActive !== undefined) return item.isActive
  if (isExternalUrl(item.url)) return false
  const path = item.url.split(/[?#]/)[0]
  if (item.exact) return pathname === path
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function NavSecondary({
  items,
  label,
  ...props
}: {
  items: readonly NavSecondaryItem[]
  /** Optional heading rendered above the menu. */
  label?: string
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()

  return (
    <SidebarGroup {...props}>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isItemActive(item, pathname)
            const external = item.external ?? isExternalUrl(item.url)
            const className = item.disabled ? "pointer-events-none opacity-50" : undefined

            const content = (
              <>
                {item.icon}
                <span>{item.title}</span>
              </>
            )

            const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
              if (item.disabled) {
                event.preventDefault()
                return
              }
              item.onSelect?.()
            }

            return (
              <SidebarMenuItem key={`${item.title}-${item.url}`}>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  isActive={active}
                  tooltip={item.title}
                  aria-disabled={item.disabled || undefined}
                  className={className}
                >
                  {external ? (
                    <a
                      href={item.url}
                      onClick={handleClick}
                      target={item.url.startsWith("http") ? "_blank" : undefined}
                      rel={item.url.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {content}
                    </a>
                  ) : (
                    <Link href={item.url} onClick={handleClick}>
                      {content}
                    </Link>
                  )}
                </SidebarMenuButton>
                {item.badge != null ? (
                  <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
