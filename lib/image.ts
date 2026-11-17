import { attachmentMime } from "./defaults";

const MAX_EDGE = 1600;
const QUALITY = 0.8;
const RECOMPRESS_ABOVE = 1_500_000;
const SKIP_TYPES = new Set(["image/svg+xml", "image/gif"]);

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read image"));
    image.src = src;
  });
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
}

export async function shrinkImage(file: File): Promise<File> {
  const type = attachmentMime(file);
  if (!type.startsWith("image/") || SKIP_TYPES.has(type)) return file;
  if (typeof window === "undefined" || typeof document === "undefined") return file;

  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
    if (scale === 1 && file.size <= RECOMPRESS_ABOVE) return file;

    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(image, 0, 0, width, height);
    const blob = await toBlob(canvas);
    if (!blob) return file;

    return new File([blob], file.name, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
