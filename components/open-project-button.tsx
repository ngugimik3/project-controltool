"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { selectProjectAction } from "@/lib/actions/project";
import { toast } from "./toast";

export function OpenProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn bts"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await selectProjectAction(projectId);
          if (result.error) {
            toast(result.error);
            return;
          }
          router.push(`/projects/${projectId}/schedule`);
        })
      }
    >
      {pending ? "Opening…" : "Open"}
    </button>
  );
}
