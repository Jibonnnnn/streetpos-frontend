/**
 * Utility for handling image URLs from the backend
 */
import { REST_API_BASE_URL } from "@/app/config/api";

export const getFullImageUrl = (imageUrl?: string | null): string | null => {
  if (!imageUrl) return null;

  const baseUrl = REST_API_BASE_URL.replace(/\/api$/, "");

  // Clean the path to avoid double slashes
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  return `${baseUrl}${cleanPath}`;
};

// Optional: For fallback placeholder
export const getImageWithFallback = (imageUrl?: string | null) => {
  const url = getFullImageUrl(imageUrl);
  return url || null;
};