import DOMPurify from "isomorphic-dompurify";

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const SAFE_MEDIA_PROTOCOLS = new Set(["http:", "https:"]);
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const HTML_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_:.-]*$/;
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;
const VIMEO_ID_PATTERN = /^\d{1,20}$/;
const SAFE_COLOR_PATTERNS = [
  /^#[0-9a-f]{3,8}$/i,
  /^(?:currentColor|transparent)$/i,
  /^var\(--[a-z0-9-_]+\)$/i,
];

function isRelativeUrl(value: string) {
  return (
    value.startsWith("/") || value.startsWith("#") || value.startsWith("?")
  );
}

export function sanitizeRichText(value: string) {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [
      "a",
      "blockquote",
      "br",
      "code",
      "em",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "hr",
      "li",
      "ol",
      "p",
      "pre",
      "strong",
      "u",
      "ul",
    ],
    ALLOWED_ATTR: ["href", "rel"],
    ALLOW_DATA_ATTR: false,
  });
}

export function sanitizeLinkUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed || CONTROL_CHARACTERS.test(trimmed)) return "";
  if (isRelativeUrl(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    return SAFE_LINK_PROTOCOLS.has(url.protocol) ? trimmed : "";
  } catch {
    return "";
  }
}

export function sanitizeMediaUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed || CONTROL_CHARACTERS.test(trimmed)) return "";
  if (trimmed.startsWith("/")) return trimmed;

  try {
    const url = new URL(trimmed);
    return SAFE_MEDIA_PROTOCOLS.has(url.protocol) ? trimmed : "";
  } catch {
    return "";
  }
}

export function getSafeEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    let videoId = "";

    if (hostname === "youtu.be") {
      videoId = url.pathname.slice(1).split("/")[0] ?? "";
    }

    if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      videoId =
        url.searchParams.get("v") ??
        (["embed", "shorts", "live"].includes(parts[0] ?? "")
          ? (parts[1] ?? "")
          : "");
    }

    if (hostname === "vimeo.com" || hostname.endsWith(".vimeo.com")) {
      videoId = url.pathname.split("/").filter(Boolean).at(-1) ?? "";
      return VIMEO_ID_PATTERN.test(videoId)
        ? `https://player.vimeo.com/video/${videoId}`
        : null;
    }

    return YOUTUBE_ID_PATTERN.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null;
  } catch {
    return null;
  }
}

export function sanitizeCssColor(value: string) {
  const trimmed = value.trim();
  return SAFE_COLOR_PATTERNS.some((pattern) => pattern.test(trimmed))
    ? trimmed
    : "";
}

export function sanitizeHtmlId(value: string) {
  const trimmed = value.trim().slice(0, 100);
  return HTML_ID_PATTERN.test(trimmed) ? trimmed : "";
}
