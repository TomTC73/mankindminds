// Automatically uses localhost during local development ('npm run dev')
// and switches to AWS Elastic Beanstalk when built for production on GitHub Pages
export const API_BASE = import.meta.env.DEV
  ? "http://localhost:8080"
  : "http://Mankindminds-backend-env.eba-2egvmjdy.eu-north-1.elasticbeanstalk.com";

export const API_URL = `${API_BASE}/api`;

export function resolveCreatorImageUrl(imageUrl) {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("/assets")) {
    return `${API_BASE}${imageUrl}`;
  }
  return imageUrl;
}