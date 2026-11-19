"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "@/lib/actions/auth";

const initial: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);
  const [show, setShow] = useState(false);

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
      <div style={{ position: "relative" }}>
        <input
          id="password"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          required
          style={{ width: "100%", paddingRight: "3.5rem" }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          style={{
            position: "absolute",
            right: ".6rem",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: ".75rem",
            fontWeight: 600,
            color: "#35a7f3",
          }}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
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