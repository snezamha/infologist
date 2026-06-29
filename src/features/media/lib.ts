export type { MediaAsset } from "./types";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export {
  getProjectMediaLibrary,
  getProjectMediaFile,
  getProjectMediaUsageStatsForUser,
  deleteProjectMediaFile,
  deleteProjectMediaFileByPublicUrl,
  uploadProjectMediaFile,
  updateProjectMediaImage,
  updateProjectMediaMetadata,
  getProjectMediaSettings,
} from "./_actions/index";
