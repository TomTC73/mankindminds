export const API_BASE = "http://localhost:8080";
export const API_URL = `${API_BASE}/api`;

export function resolveCreatorImageUrl(imageUrl) {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("/assets")) {
    return `${API_BASE}${imageUrl}`;
  }
  return imageUrl;
}
