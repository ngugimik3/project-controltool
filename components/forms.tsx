"use client";

import { useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/types";
import { toast } from "./toast";

export type FormAction = (formData: FormData) => Promise<ActionResult>;
export type ButtonFields = Record<string, string | number | boolean>;

function runAction(
  action: FormAction,
  formData: FormData,
  onDone?: (result: ActionResult) => void,
) {
  return action(formData).then((result) => {
    if (result.error) toast(result.error);
    else if (result.message) toast(result.message);
    onDone?.(result);
    return result;
  });
}

export function SubmitForm({
  action,
  children,
  submitLabel,
  pendingLabel,
  className,
  buttonClassName = "btn btp",
  resetOnSuccess = false,
  onSuccess,
}: {
  action: FormAction;
  children: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  className?: string;
  buttonClassName?: string;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await runAction(action, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError("");
      if (resetOnSuccess) form.reset();
      onSuccess?.();
    });
  }

  return (
    <form ref={formRef} className={className} onSubmit={onSubmit}>
      {error ? <div className="err">{error}</div> : null}
      {children}
      <button type="submit" className={buttonClassName} disabled={pending}>
        {pending ? (pendingLabel ?? "Saving…") : submitLabel}
      </button>
    </form>
  );
}

export function AutoForm({
  action,
  children,
  className,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();
  const busy = useRef(false);

  function submit() {
    const form = formRef.current;
    if (!form || busy.current) return;
    const formData = new FormData(form);
    busy.current = true;
    startTransition(async () => {
      try {
        await runAction(action, formData);
      } finally {
        busy.current = false;
      }
    });
  }

  function shouldSubmit(target: EventTarget | null, mode: "blur" | "change") {
    if (!(target instanceof HTMLElement)) return false;
    if (!target.getAttribute("name")) return false;
    if (target instanceof HTMLButtonElement) return false;
    if (target instanceof HTMLInputElement) {
      if (target.type === "file" || target.type === "hidden") return false;
      if (target.type === "text" || target.type === "number" || target.type === "email") {
        return mode === "blur";
      }
      return mode === "change";
    }
    if (target instanceof HTMLSelectElement) return mode === "change";
    if (target instanceof HTMLTextAreaElement) return mode === "blur";
    return false;
  }

  return (
    <form
      ref={formRef}
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      onBlur={(event) => {
        if (shouldSubmit(event.target, "blur")) submit();
      }}
      onChange={(event) => {
        if (shouldSubmit(event.target, "change")) submit();
      }}
    >
      {children}
    </form>
  );
}

export function ActionButton({
  action,
  fields,
  label,
  pendingLabel,
  className = "btn btp",
  confirm,
  title,
  onSuccess,
}: {
  action: FormAction;
  fields?: ButtonFields;
  label: ReactNode;
  pendingLabel?: string;
  className?: string;
  confirm?: string;
  title?: string;
  onSuccess?: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (confirm && !window.confirm(confirm)) return;
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields ?? {})) {
      formData.set(key, String(value));
    }
    startTransition(async () => {
      const result = await runAction(action, formData);
      if (!result.error) onSuccess?.();
    });
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={pending}
      title={title}
    >
      {pending ? (pendingLabel ?? "Saving…") : label}
    </button>
  );
}

export function ConfirmButton({
  action,
  fields,
  label,
  confirm,
  className = "btn btd",
  pendingLabel,
}: {
  action: FormAction;
  fields?: ButtonFields;
  label: ReactNode;
  confirm: string;
  className?: string;
  pendingLabel?: string;
}) {
  const router = useRouter();

  return (
    <ActionButton
      action={action}
      fields={fields}
      label={label}
      pendingLabel={pendingLabel}
      className={className}
      confirm={confirm}
      onSuccess={() => router.refresh()}
    />
  );
}
