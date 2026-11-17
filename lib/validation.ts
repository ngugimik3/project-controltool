import { z } from "zod";

export const zDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.");

export const zShortText = z.string().trim().max(300, "That value is too long.");
export const zLongText = z.string().trim().max(20000, "That text is too long.");

export function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function parseForm<T extends z.ZodType>(
  schema: T,
  formData: FormData,
): { data: z.infer<T>; error?: never } | { data?: never; error: string } {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") raw[key] = value;
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Check the values and try again." };
  }
  return { data: parsed.data };
}

export function zodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the values and try again.";
}
