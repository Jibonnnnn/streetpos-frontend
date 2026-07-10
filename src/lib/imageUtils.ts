import { IMAGE_BASE_URL } from "@/app/config/api";

export const getFullImageUrl = (imageRef?: string | null): string | null => {
  if (!imageRef) return null;

  if (/^https?:\/\//i.test(imageRef) || imageRef.startsWith("data:")) {
    return imageRef;
  }

  const cleanRef = imageRef.replace(/^\/+/, "").trim();

  if (cleanRef.startsWith("images/")) {
    return `${IMAGE_BASE_URL}/${cleanRef}`;
  }

  return `${IMAGE_BASE_URL}/images/menu/${cleanRef}`;
};