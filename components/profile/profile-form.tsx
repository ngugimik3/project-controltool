"use client";

import { useActionState, useEffect } from "react";
import { toast } from "@/components/toast";
import { updateProfileAction } from "@/lib/actions/profile";
import type { ProfileState, ProfileView } from "@/lib/types";

const initialState: ProfileState = {};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="field-error" role="alert">
      {message}
    </span>
  );
}

export function ProfileForm({ profile }: { profile: ProfileView }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  useEffect(() => {
    if (state.message) toast(state.message);
    else if (state.error) toast(state.error);
  }, [state]);

  const errors = state.fieldErrors ?? {};
  const hasFieldErrors = Object.keys(errors).length > 0;

  return (
    <form action={formAction} className="profile-form" noValidate>
      {state.error && !hasFieldErrors ? <div className="err span-2">{state.error}</div> : null}

      <label>
        <span>Full name</span>
        <input
          name="name"
          defaultValue={profile.name}
          maxLength={120}
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
        />
        <FieldError message={errors.name} />
      </label>

      <label>
        <span>Phone</span>
        <input
          name="phone"
          type="tel"
          defaultValue={profile.phone}
          maxLength={30}
          autoComplete="tel"
          placeholder="+254 700 000 000"
          aria-invalid={Boolean(errors.phone)}
        />
        <FieldError message={errors.phone} />
      </label>

      <label>
        <span>Job title</span>
        <input
          name="jobTitle"
          defaultValue={profile.jobTitle}
          maxLength={120}
          autoComplete="organization-title"
          placeholder="Project Engineer"
          aria-invalid={Boolean(errors.jobTitle)}
        />
        <FieldError message={errors.jobTitle} />
      </label>

      <label>
        <span>Department</span>
        <input
          name="department"
          defaultValue={profile.department}
          maxLength={120}
          autoComplete="organization"
          placeholder="Engineering"
          aria-invalid={Boolean(errors.department)}
        />
        <FieldError message={errors.department} />
      </label>

      <label className="span-2">
        <span>Bio</span>
        <textarea
          name="bio"
          defaultValue={profile.bio}
          rows={4}
          maxLength={500}
          placeholder="A short note about your role and experience."
          aria-invalid={Boolean(errors.bio)}
        />
        <FieldError message={errors.bio} />
      </label>

      <div className="span-2 profile-form-actions">
        <button type="submit" className="btn btp" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </button>
        <span className="sub">Your name and avatar update everywhere in the app.</span>
      </div>
    </form>
  );
}
