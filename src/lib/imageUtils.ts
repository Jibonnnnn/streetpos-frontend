/**
 * Utility for handling image URLs from the backend
 */
export const getFullImageUrl = (imageUrl?: string | null): string | null => {
  if (!imageUrl) return null;

  const baseUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL 
    : 'http://localhost:5032';

  // Clean the path to avoid double slashes
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  return `${baseUrl}${cleanPath}`;
};

// Optional: For fallback placeholder
export const getImageWithFallback = (imageUrl?: string | null) => {
  const url = getFullImageUrl(imageUrl);
  return url || null;
};