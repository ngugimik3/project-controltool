import Image from "next/image";
import type { CSSProperties } from "react";

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
}

export function Avatar({
  name,
  avatarUrl,
  size = 40,
  className = "",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const style = { "--avatar-size": `${size}px` } as CSSProperties;
  const classes = `avatar${className ? ` ${className}` : ""}`;

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        unoptimized
        className={classes}
        style={style}
      />
    );
  }

  return (
    <span aria-hidden="true" className={`${classes} avatar-initials`} style={style}>
      {initialsOf(name)}
    </span>
  );
}
