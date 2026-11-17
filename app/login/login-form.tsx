"use client";

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
