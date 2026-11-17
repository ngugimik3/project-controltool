#!/usr/bin/env python3
"""
Project Control Tool, loop 2:
  Prisma schema (auth + all app tables), Better Auth with username login,
  login page, app shell with the tabs, proxy, seed script, legacy CSS.

Run from the project root (~/Attachment/Projects/project-control):
    python3 pct_loop2.py
Nothing is written unless every check passes.
"""
import pathlib
import re
import sys


def fail(message):
    sys.exit(message + "\nNothing was written.")


# ------------------------------------------------------------------ checks
for required in ("package.json", "lib/prisma.ts", "prisma/schema.prisma", "app/layout.tsx"):
    if not pathlib.Path(required).exists():
        fail(f"{required} not found. Run this from the project root after loop 1.")

if not pathlib.Path("node_modules/better-auth").exists():
    fail("better-auth is not installed. Run: npm install")

legacy = pathlib.Path("legacy/Project_Control_Tool__8_.html")
if not legacy.exists():
    fail("legacy/Project_Control_Tool__8_.html is missing. Copy the HTML into legacy/ first.")

css_match = re.search(r"<style>(.*?)</style>", legacy.read_text(encoding="utf-8"), flags=re.S)
if not css_match:
    fail("Could not find the <style> block in the legacy HTML.")
legacy_css = css_match.group(1).replace("\r\n", "\n").strip()

OVERWRITE = {"prisma/schema.prisma", "app/layout.tsx", "app/page.tsx", "app/globals.css"}
files = {}

# ------------------------------------------------------------------ prisma
files["prisma/schema.prisma"] = r'''generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// ---------- Better Auth ----------

model User {
  id              String    @id
  name            String
  email           String    @unique
  emailVerified   Boolean   @default(false)
  image           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  username        String?   @unique
  displayUsername String?
  role            String    @default("user")
  active          Boolean   @default(true)
  lastLoginAt     DateTime?
  sessions        Session[]
  accounts        Account[]

  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([userId])
  @@map("account")
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([identifier])
  @@map("verification")
}

// ---------- Project Control Tool ----------

model Project {
  id             String          @id @default(cuid())
  name           String
  client         String
  type           String
  contract       Float
  stage          Int             @default(0)
  specDim        String          @default("")
  specVolt       String          @default("")
  specKw         String          @default("")
  specStd        String          @default("")
  specNotes      String          @default("")
  signedBy       String          @default("")
  signedAt       DateTime?
  extra          Json            @default("{}")
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  tasks          Task[]
  purchaseOrders PurchaseOrder[]
  checkItems     CheckItem[]
  stageReviews   StageReview[]
  docs           HandoverDoc[]
  costLines      CostLine[] 
  params         Param[]
  visits         SiteVisit[]
  attachments    Attachment[]
  notes          Note[]

  @@index([stage])
  @@map("projects")
}

model Note {
  id        String  @id @default(cuid())
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  key       String
  text      String  @default("")

  @@unique([projectId, key])
  @@map("notes")
}

model Task {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name        String
  role        String   @default("Unassigned")
  owner       String   @default("")
  startDate   DateTime @db.Date
  endDate     DateTime @db.Date
  status      Int      @default(0)
  sortOrder   Int      @default(0)
  dependsOnId String?
  dependsOn   Task?    @relation("TaskDeps", fields: [dependsOnId], references: [id], onDelete: SetNull)
  dependents  Task[]   @relation("TaskDeps")

  @@index([projectId])
  @@map("tasks")
}

model PurchaseOrder {
  id         String   @id @default(cuid())
  projectId  String
  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  item       String
  supplier   String
  needBy     DateTime @db.Date
  promisedBy DateTime @db.Date
  cost       Float
  status     Int      @default(0)
  waybill    String   @default("")
  createdAt  DateTime @default(now())

  @@index([projectId])
  @@map("purchase_orders")
}

model CheckItem {
  id          String            @id @default(cuid())
  projectId   String
  project     Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  kind        String
  item        String
  reading     String            @default("")
  result      String            @default("")
  note        String            @default("")
  status      Int               @default(0)
  sortOrder   Int               @default(0)
  reviews     CheckItemReview[]
  attachments Attachment[]

  @@index([projectId, kind])
  @@map("check_items")
}

model CheckItemReview {
  id          String    @id @default(cuid())
  checkItemId String
  checkItem   CheckItem @relation(fields: [checkItemId], references: [id], onDelete: Cascade)
  version     Int
  date        DateTime  @db.Date
  author      String
  status      String
  text        String

  @@index([checkItemId])
  @@map("check_item_reviews")
}

model StageReview {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  key       String
  version   Int
  date      DateTime @db.Date
  author    String
  status    String
  text      String

  @@index([projectId, key])
  @@map("stage_reviews")
}

model HandoverDoc {
  id        String  @id @default(cuid())
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  slot      String
  ref       String  @default("")
  ready     Boolean @default(false)
  sortOrder Int     @default(0)

  @@index([projectId])
  @@map("handover_docs")
}

model CostLine {
  id        String  @id @default(cuid())
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  code      String
  budget    Float   @default(0)
  actual    Float   @default(0)

  @@index([projectId])
  @@map("cost_lines")
}

model Param {
  id        String  @id @default(cuid())
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  groupName String
  name      String
  value     String  @default("")
  unit      String  @default("")

  @@index([projectId])
  @@map("params")
}

model SiteVisit {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  date      DateTime @db.Date
  type      String
  who       String   @default("")
  purpose   String   @default("")
  notes     String   @default("")
  status    String   @default("Planned")

  @@index([projectId])
  @@map("site_visits")
}

model Attachment {
  id          String     @id @default(cuid())
  projectId   String
  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  scope       String
  checkItemId String?
  checkItem   CheckItem? @relation(fields: [checkItemId], references: [id], onDelete: Cascade)
  name        String
  mimeType    String
  size        Int
  isImage     Boolean    @default(false)
  data        Bytes
  uploadedBy  String     @default("")
  createdAt   DateTime   @default(now())

  @@index([projectId, scope])
  @@map("attachments")
}

model Setting {
  key       String   @id
  value     Json
  updatedAt DateTime @updatedAt

  @@map("settings")
}

model ActivityLog {
  id       Int      @id @default(autoincrement())
  ts       DateTime @default(now())
  userName String
  action   String

  @@index([ts])
  @@map("activity_log")
}
'''

# ------------------------------------------------------------------ auth + libs
files["lib/auth-config.ts"] = r'''import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { prisma } from "./prisma";

const extraOrigins = (process.env.TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

/** Shared options. The Next.js instance in lib/auth.ts adds the cookie plugin. */
export const baseOptions = {
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, autoSignIn: false },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  session: { expiresIn: 60 * 60 * 24 * 7 },
  trustedOrigins: ["http://localhost:3000", ...extraOrigins],
} satisfies BetterAuthOptions;

/** Instance for scripts and password hashing. It never touches request cookies. */
export const authCore = betterAuth({
  ...baseOptions,
  plugins: [username()],
});
'''

files["lib/auth.ts"] = r'''import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { baseOptions } from "./auth-config";
import { normalizeRole, type Role } from "./roles";

export const auth = betterAuth({
  ...baseOptions,
  // nextCookies() must be the last plugin.
  plugins: [username(), nextCookies()],
});

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: Role;
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const user = session.user as Record<string, unknown>;
  return {
    id: String(user.id),
    name: String(user.name ?? ""),
    username: String(user.username ?? ""),
    role: normalizeRole(user.role),
  };
});

/** Redirects to /login when signed out, and to /dashboard when the role is not allowed. */
export async function requireUser(...allowed: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (allowed.length > 0 && !allowed.includes(user.role)) redirect("/dashboard");
  return user;
}
'''

files["lib/roles.ts"] = r'''export type Role = "superadmin" | "admin" | "user";

export const ROLES: Role[] = ["superadmin", "admin", "user"];

export const ROLE_LABEL: Record<Role, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  user: "User",
};

export function normalizeRole(value: unknown): Role {
  return value === "superadmin" || value === "admin" ? value : "user";
}

/** Same idea as the legacy can('admin','superadmin'). */
export function can(role: Role, ...allowed: Role[]): boolean {
  return allowed.includes(role);
}
'''

files["lib/constants.ts"] = r'''export const TABS = [
  "dashboard",
  "projects",
  "survey",
  "schedule",
  "procurement",
  "fat",
  "install",
  "commis",
  "sat",
  "training",
  "support",
  "handover",
  "costing",
  "admin",
] as const;

export type TabKey = (typeof TABS)[number];

export const TL: Record<TabKey, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  survey: "Site Survey",
  schedule: "Schedule",
  procurement: "Procurement",
  fat: "FAT",
  install: "Installation",
  commis: "Commissioning",
  sat: "SAT",
  training: "Training",
  support: "Support",
  handover: "Handover",
  costing: "Costing",
  admin: "Admin",
};

export const STAGES = [
  "Inception",
  "Site Survey",
  "Procurement",
  "Workshop & FAT",
  "Installation",
  "Commissioning",
  "SAT",
  "Training",
  "Handover",
  "Closed",
] as const;

export const TASK_STATUS = ["Not started", "In progress", "Blocked", "Done"] as const;

export const PO_STATUS = [
  "Draft",
  "Approved",
  "Sent",
  "Confirmed",
  "In production",
  "Shipped",
  "In transit",
  "Received",
  "Inspected",
] as const;

export const DEFAULT_PROJECT_TYPES = ["Control panel", "Pump station", "Fountain system"];
'''

files["lib/users.ts"] = r'''import { randomUUID } from "node:crypto";
import { authCore } from "./auth-config";
import { prisma } from "./prisma";
import type { Role } from "./roles";

const USERNAME_PATTERN = /^[a-z0-9_.]{3,30}$/;

export async function hashPassword(password: string): Promise<string> {
  const context = await authCore.$context;
  return context.password.hash(password);
}

/**
 * Creates a user with a username and password without touching the current session.
 * (Using the sign-up endpoint from an admin session would sign the admin in as the new user.)
 */
export async function createUserRecord(input: {
  name: string;
  username: string;
  password: string;
  role: Role;
}): Promise<string> {
  const username = input.username.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error("Username must be 3 to 30 letters, numbers, dots or underscores.");
  }
  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) throw new Error("That username already exists.");

  const id = randomUUID();
  const password = await hashPassword(input.password);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id,
        name: input.name.trim() || username,
        email: `${username}@pct.local`,
        emailVerified: true,
        username,
        displayUsername: input.username.trim(),
        role: input.role,
      },
    }),
    prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: id,
        providerId: "credential",
        userId: id,
        password,
      },
    }),
  ]);

  return id;
}
'''

files["lib/actions/auth.ts"] = r'''"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../auth";
import { prisma } from "../prisma";

export type LoginState = { error?: string };

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  void _previous;
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) {
    return { error: "Enter your username and password." };
  }

  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true, active: true },
  });
  if (user && !user.active) {
    return { error: "This account is deactivated. Ask an admin." };
  }

  try {
    await auth.api.signInUsername({
      body: { username, password },
      headers: await headers(),
    });
  } catch (error) {
    console.error("sign-in failed", error instanceof Error ? error.message : error);
    return { error: "Invalid username or password." };
  }

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
  }
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (error) {
    console.error("sign-out failed", error);
  }
  redirect("/login");
}
'''

files["app/api/auth/[...all]/route.ts"] = r'''import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
'''

files["proxy.ts"] = r'''import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

/**
 * Cheap first gate: no session cookie means go to /login.
 * The real session check happens in the app layout (requireUser).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const open = pathname === "/login" || pathname.startsWith("/api/auth");
  const hasCookie = SESSION_COOKIES.some((name) => request.cookies.has(name));

  if (!hasCookie && !open) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)",
  ],
};
'''

# ------------------------------------------------------------------ ui
files["app/layout.tsx"] = r'''import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project control tool",
  description: "Track engineering projects from inception to handover.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
'''

files["app/page.tsx"] = r'''import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
'''

files["app/login/page.tsx"] = r'''import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div id="login">
      <div className="lc">
        <h2>Project control tool</h2>
        <p className="sub">Sign in to continue</p>
        <LoginForm />
      </div>
    </div>
  );
}
'''

files["app/login/login-form.tsx"] = r'''"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/actions/auth";

const initial: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action}>
      {state.error ? <div className="err">{state.error}</div> : null}
      <label className="fl" htmlFor="username">
        Username
      </label>
      <input id="username" name="username" autoComplete="username" required />
      <label className="fl" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <button
        type="submit"
        className="btn btp"
        style={{ width: "100%", marginTop: ".9rem" }}
        disabled={pending}
      >
        {pending ? "Signing in…" : "Log in"}
      </button>
    </form>
  );
}
'''

files["components/tabs.tsx"] = r'''"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Tabs({ tabs }: { tabs: { key: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <div className="tabs" id="tabs">
      {tabs.map((tab) => {
        const active =
          pathname === `/${tab.key}` || pathname.startsWith(`/${tab.key}/`);
        return (
          <Link
            key={tab.key}
            href={`/${tab.key}`}
            className={`tab${active ? " active" : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
'''

files["app/(app)/layout.tsx"] = r'''import { logoutAction } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth";
import { TABS, TL } from "@/lib/constants";
import { ROLE_LABEL } from "@/lib/roles";
import { Tabs } from "@/components/tabs";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const tabs = TABS.filter((tab) => tab !== "admin" || user.role !== "user").map(
    (tab) => ({ key: tab, label: TL[tab] }),
  );

  return (
    <div className="wrap" id="app" data-role={user.role}>
      <div className="hdr">
        <div>
          <div className="hdr-title">Project control tool</div>
          <div className="hdr-meta" id="meta">
            No project selected
          </div>
        </div>
        <div className="hr">
          <select id="sel" aria-label="Project" disabled defaultValue="">
            <option value="">No projects</option>
          </select>
          <form action={logoutAction}>
            <button type="submit" className="user-badge" title="Click to log out">
              {user.name} · {ROLE_LABEL[user.role]}
            </button>
          </form>
        </div>
      </div>
      <Tabs tabs={tabs} />
      <div id="view">{children}</div>
    </div>
  );
}
'''

files["app/(app)/[tab]/page.tsx"] = r'''import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { TABS, TL, type TabKey } from "@/lib/constants";

export default async function TabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { tab } = await params;
  const user = await requireUser();

  if (!(TABS as readonly string[]).includes(tab)) notFound();
  if (tab === "admin" && user.role === "user") redirect("/dashboard");

  return (
    <div className="card">
      <div className="ct">{TL[tab as TabKey]}</div>
      <p className="sub">This tab is built in a later step.</p>
    </div>
  );
}
'''

files["scripts/env.ts"] = r'''import { config } from "dotenv";

config({ path: ".env.local" });
'''

files["scripts/seed-superadmin.ts"] = r'''import "./env";
import { createUserRecord } from "../lib/users";
import { prisma } from "../lib/prisma";

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Super Admin";
  if (!username || !password) {
    throw new Error("Set ADMIN_USERNAME and ADMIN_PASSWORD in .env.local first.");
  }

  const existing = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });
  if (existing) {
    console.log(`User "${username}" already exists. Nothing to do.`);
    return;
  }

  await createUserRecord({ name, username, password, role: "superadmin" });
  console.log(`Created super admin "${username}".`);
}

main()
  .catch((error) => {
    console.error("FAIL", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
'''

files["app/globals.css"] = (
    '@import "tailwindcss";\n\n'
    "/* ---- ported from the legacy Project Control Tool ---- */\n"
    + legacy_css
    + "\n\n/* ---- additions for Next.js links and buttons ---- */\n"
    "a.tab{text-decoration:none;display:inline-block}\n"
    "button.user-badge{border:0;font:inherit;cursor:pointer}\n"
)

# ------------------------------------------------------------------ write
for path in files:
    exists = pathlib.Path(path).exists()
    if exists and path not in OVERWRITE:
        fail(f"{path} already exists.")

for path, text in files.items():
    target = pathlib.Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8", newline="\n")
    print("wrote", path)

print("\nDone. Next: npx prisma validate")
