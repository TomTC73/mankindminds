// (removed Elastic Beanstalk / AWS reference)

export const API_BASE = "https://mankind-minds-api-151580998157.europe-west2.run.app";

export const API_URL = `${API_BASE}/api`;

export function resolveCreatorImageUrl(imageUrl) {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("/assets")) {
    return encodeURI(`${API_BASE}${imageUrl}`);
  }
  return imageUrl;
}

export function resolveStudioImageUrl(imageUrl) {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("/assets")) {
    return encodeURI(`${API_BASE}${imageUrl}`);
  }
  return imageUrl;
}

export const resolveImageUrl = resolveCreatorImageUrl;

export function resolveSafeExternalUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}