export type MediaAsset = {
  id: string;
  shortId: string;
  filename: string;
  mimeType: string;
  size: number;
  publicUrl: string;
  uploadedBy?: {
    name: string | null;
    email: string | null;
  } | null;
  alt: string;
  caption: string;
  description: string;
  credit: string;
  createdAt: Date;
};
