import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

async function LoginGate() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div id="login">
      <div className="login-shell">
        <div className="login-logo">
          <Image
            src="/images/idw-frjolC_1793681920400.png"
            alt="Davis & Shirtliff"
            width={300}
            height={114}
            priority
          />
        </div>
        <div className="lc">
          <h2>Project Control</h2>
          <p className="sub">Sign in to manage delivery from survey to handover.</p>
          <LoginForm />
        </div>
        <p className="login-foot">Know how through experience</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="wrap">Loading…</div>}>
      <LoginGate />
    </Suspense>
  );
}