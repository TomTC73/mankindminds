export const MAX_PORTFOLIO_SLOTS = 8;
export const MAX_TEXT_CHARS = 15000;
export const PORTFOLIO_ACCEPT = [
  "image/jpeg", "image/png", "image/webp",
  "video/mp4", "video/quicktime", "video/webm",
  "text/plain", ".txt", ".docx",
].join(",");

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const VIDEO_EXTENSIONS = ["mp4", "mov", "webm"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const MAX_TEXT_FILE_BYTES = 1024 * 1024;
const MAX_DOCX_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 30.5;

const extensionOf = (file) => {
  const name = (file.name || "").toLowerCase();
  return name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";
};

const readVideoSeconds = (file) => new Promise((resolve) => {
  const video = document.createElement("video");
  const url = URL.createObjectURL(file);
  const finish = (value) => {
    clearTimeout(timer);
    URL.revokeObjectURL(url);
    resolve(value);
  };
  const timer = setTimeout(() => finish(null), 8000);
  video.preload = "metadata";
  video.onloadedmetadata = () => finish(Number.isFinite(video.duration) ? video.duration : null);
  video.onerror = () => finish(null);
  video.src = url;
});

// Returns a message when the file cannot be used as a portfolio item. The server repeats every check.
export async function portfolioFileProblem(file) {
  const extension = extensionOf(file);
  const isVideo = file.type.startsWith("video/") || VIDEO_EXTENSIONS.includes(extension);
  const isImage = ["image/jpeg", "image/png", "image/webp"].includes(file.type)
    || (!file.type && IMAGE_EXTENSIONS.includes(extension));
  const isText = file.type === "text/plain" || ["txt", "docx"].includes(extension);

  if (isImage) {
    return file.size > MAX_IMAGE_BYTES
      ? `${file.name} is larger than the 5 MB limit. Choose a smaller image.`
      : "";
  }
  if (isVideo) {
    if (!["video/mp4", "video/quicktime", "video/webm"].includes(file.type) && !VIDEO_EXTENSIONS.includes(extension)) {
      return "Choose an MP4, MOV, or WebM video.";
    }
    if (file.size > MAX_VIDEO_BYTES) return `${file.name} is larger than the 25 MB limit. Choose a shorter or smaller video.`;
    const seconds = await readVideoSeconds(file);
    if (seconds !== null && seconds > MAX_VIDEO_SECONDS) return `${file.name} is longer than 30 seconds.`;
    return "";
  }
  if (isText) {
    if (extension === "docx") {
      return file.size > MAX_DOCX_BYTES ? `${file.name} is too large. Text can be up to 15,000 characters.` : "";
    }
    if (file.size > MAX_TEXT_FILE_BYTES) return `${file.name} is too large. Text can be up to 15,000 characters.`;
    const length = [...(await file.text())].length;
    return length > MAX_TEXT_CHARS
      ? `${file.name} has ${length.toLocaleString()} characters. Text can be up to 15,000.`
      : "";
  }
  return "Choose an image, a video up to 30 seconds, or a .txt or .docx text file.";
}

export function profileImageProblem(file) {
  return file.size > MAX_IMAGE_BYTES
    ? `${file.name} is larger than the 5 MB limit. Choose a smaller image.`
    : "";
}
