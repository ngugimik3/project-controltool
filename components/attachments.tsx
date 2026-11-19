"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { Camera, ImagePlus, Paperclip } from "lucide-react";
import { deleteAttachmentAction, uploadAttachmentsAction } from "@/lib/actions/attachment";
import {
  ATTACHMENT_ACCEPT,
  MAX_ATTACHMENT_BYTES,
  attachmentMime,
  isAllowedAttachmentMime,
} from "@/lib/defaults";
import { shrinkImage } from "@/lib/image";
import type { AttachmentMeta } from "@/lib/types";
import { ConfirmButton } from "./forms";
import { toast } from "./toast";

function rejection(file: File, mime: string): string | null {
  if (!file.size) return `${file.name} is empty`;
  if (!isAllowedAttachmentMime(mime)) return `${file.name} is not an allowed type`;
  if (file.size > MAX_ATTACHMENT_BYTES) return `${file.name} is over 20 MB`;
  return null;
}

const MAX_TOTAL_BYTES = 24 * 1024 * 1024;

export function AttachmentPicker({
  projectId,
  scope,
  itemId,
  variant = "files",
}: {
  projectId: string;
  scope: string;
  itemId?: string;
  variant?: "files" | "photo" | "item";
}) {
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (!files.length) return;

    startTransition(async () => {
      const prepared: File[] = [];
      const skipped: string[] = [];
      let total = 0;

      for (const file of files) {
        const sourceMime = attachmentMime(file);
        if (!file.size) {
          skipped.push(`${file.name} is empty`);
          continue;
        }
        const candidate = sourceMime.startsWith("image/") ? await shrinkImage(file) : file;
        const problem = rejection(candidate, attachmentMime(candidate));
        if (problem) {
          skipped.push(problem);
          continue;
        }
        if (total + candidate.size > MAX_TOTAL_BYTES) {
          skipped.push(`${file.name} would exceed the total upload limit`);
          continue;
        }
        total += candidate.size;
        prepared.push(candidate);
      }

      if (!prepared.length) {
        toast(skipped.join("; ") || "No files selected.");
        return;
      }

      const formData = new FormData();
      formData.set("projectId", projectId);
      formData.set("scope", scope);
      if (itemId) formData.set("itemId", itemId);
      for (const file of prepared) formData.append("files", file);

      const result = await uploadAttachmentsAction(formData);
      if (result.error) {
        toast(skipped.length ? `${result.error} ${skipped.join("; ")}` : result.error);
        return;
      }
      toast(
        [result.message, skipped.length ? `Skipped: ${skipped.join("; ")}` : ""]
          .filter(Boolean)
          .join(" "),
      );
    });
  }

  const Icon = variant === "photo" ? Camera : variant === "item" ? ImagePlus : Paperclip;
  const label =
    variant === "photo" ? "Take photo" : variant === "item" ? "Add photo" : "Add files";

  return (
    <>
      <button
        type="button"
        className={variant === "item" ? "btn bts" : "btn btg"}
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? (
          "Uploading…"
        ) : (
          <>
            <Icon className="size-4" aria-hidden />
            {label}
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple={variant !== "photo"}
        hidden
        disabled={pending}
        accept={variant === "files" ? ATTACHMENT_ACCEPT : "image/*"}
        capture={variant === "photo" ? "environment" : undefined}
        onChange={onChange}
      />
    </>
  );
}

export function AttachmentThumb({
  attachment,
  small,
}: {
  attachment: AttachmentMeta;
  small?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const url = `/api/attachments/${attachment.id}`;

  if (!attachment.isImage || failed) {
    return (
      <a className="btn bts" href={url} target="_blank" rel="noreferrer">
        Open
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={attachment.name}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        style={small ? { width: 56, height: 42 } : undefined}
      />
    </a>
  );
}

function AttachmentTile({
  attachment,
  projectId,
}: {
  attachment: AttachmentMeta;
  projectId: string;
}) {
  return (
    <div className="at" style={{ width: 56 }}>
      <AttachmentThumb attachment={attachment} small />
      <small title={attachment.name}>{attachment.name}</small>
      <ConfirmButton
        action={deleteAttachmentAction}
        fields={{ projectId, attachmentId: attachment.id }}
        label="Remove"
        confirm="Remove this file?"
        className="btn btd"
      />
    </div>
  );
}

export function AttachmentStrip({
  attachments,
  projectId,
  scope,
  itemId,
  locked,
}: {
  attachments: AttachmentMeta[];
  projectId: string;
  scope: string;
  itemId: string;
  locked?: boolean;
}) {
  return (
    <div className="ph" style={{ marginTop: 4, alignItems: "center" }}>
      {attachments.map((attachment) => (
        <AttachmentTile
          key={attachment.id}
          attachment={attachment}
          projectId={projectId}
        />
      ))}
      {locked ? null : (
        <AttachmentPicker projectId={projectId} scope={scope} itemId={itemId} variant="item" />
      )}
    </div>
  );
}
