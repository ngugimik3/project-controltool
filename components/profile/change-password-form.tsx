"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "@/components/toast";
import { changePasswordAction } from "@/lib/actions/profile";
import type { PasswordState } from "@/lib/types";

const initialState: PasswordState = {};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="field-error" role="alert">
      {message}
    </span>
  );
}

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
    if (state.message) toast(state.message);
    else if (state.error) toast(state.error);
  }, [state]);

  const errors = state.fieldErrors ?? {};

  return (
    <form ref={formRef} action={formAction} className="stack-form" noValidate>
      <label>
        <span>Current password</span>
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(errors.currentPassword)}
        />
        <FieldError message={errors.currentPassword} />
      </label>

      <label>
        <span>New password</span>
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={Boolean(errors.newPassword)}
        />
        <FieldError message={errors.newPassword} />
      </label>

      <label>
        <span>Confirm new password</span>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={Boolean(errors.confirmPassword)}
        />
        <FieldError message={errors.confirmPassword} />
      </label>

      <div>
        <button type="submit" className="btn btp" disabled={pending}>
          {pending ? "Updating…" : "Change password"}
        </button>
      </div>
      <p className="sub">Changing your password signs out your other sessions.</p>
    </form>
  );
}
