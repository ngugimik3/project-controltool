"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toast";
import { attachmentMime } from "@/lib/defaults";
import { removeAvatarAction, uploadAvatarAction } from "@/lib/actions/profile";
import { Avatar } from "./avatar";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const ACCEPT = "image/png,image/jpeg,image/webp";

export function AvatarUploader({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleFile(file: File | undefined) {
    setError("");
    if (!file) return;

    if (!ALLOWED_TYPES.has(attachmentMime(file))) {
      setError("Use a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Keep the image under 2 MB.");
      return;
    }

    const formData = new FormData();
    formData.set("avatar", file);
    startTransition(async () => {
      const result = await uploadAvatarAction(formData);
      if (result.error) {
        setError(result.fieldErrors?.avatar ?? result.error);
        toast(result.error);
        return;
      }
      toast(result.message ?? "Avatar updated.");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    });
  }

  function removeAvatar() {
    setError("");
    startTransition(async () => {
      const result = await removeAvatarAction();
      if (result.error) {
        toast(result.error);
        return;
      }
      toast(result.message ?? "Avatar removed.");
      router.refresh();
    });
  }

  return (
    <div className="avatar-upload">
      <Avatar name={name} avatarUrl={avatarUrl} size={96} />
      <div className="avatar-actions">
        <button
          type="button"
          className="btn bts"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
        >
          {pending ? "Working…" : avatarUrl ? "Change photo" : "Upload photo"}
        </button>
        {avatarUrl ? (
          <button type="button" className="btn btg" onClick={removeAvatar} disabled={pending}>
            Remove
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hide"
        aria-label="Upload avatar"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <p className="avatar-hint">PNG, JPG or WebP · up to 2 MB</p>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
