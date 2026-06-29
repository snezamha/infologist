"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { CheckCircle2, FileIcon, Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toastManager } from "@/lib/toast-manager";
import { cn } from "@/lib/utils";
import { formatFileSize, type MediaAsset } from "@/features/media/lib";
import { uploadProjectMediaFile } from "@/features/media/_actions";

type FileUploadState = {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  result?: MediaAsset;
};

type FileDropzoneProps = {
  projectId?: string;
  domainId?: string;
  projectPublicId?: string;
  accept?: string;
  maxSizeMB: number;
  multiple?: boolean;
  dropLabel: string;
  orLabel: string;
  selectLabel: string;
  maxSizeLabel: string;
  fileTooLargeMsg: string;
  uploadSuccessMsg: string;
  uploadFailedMsg: string;
  removeLabel: string;
  onUploadComplete?: (files: MediaAsset[]) => void;
  className?: string;
};

function parseUploadError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const message = error.message;
    if (message.includes("FILE_TOO_LARGE:")) return fallback;
    if (message.includes("STORAGE_QUOTA_EXCEEDED:")) return fallback;
    if (message.includes("TOTAL_QUOTA_EXCEEDED:")) return fallback;
    if (message.includes("HOURLY_QUOTA_EXCEEDED:")) return fallback;
    if (message === "EMPTY_FILE") return fallback;
    if (message === "FILE_REQUIRED") return fallback;
    return message || fallback;
  }

  return fallback;
}

export function FileDropzone({
  projectId,
  domainId,
  projectPublicId,
  accept,
  maxSizeMB,
  multiple = true,
  dropLabel,
  orLabel,
  selectLabel,
  maxSizeLabel,
  fileTooLargeMsg,
  uploadSuccessMsg,
  uploadFailedMsg,
  removeLabel,
  onUploadComplete,
  className,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<FileUploadState[]>([]);
  const [isPending, startTransition] = useTransition();
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const removeUpload = useCallback((index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const uploadFile = useCallback(
    (file: File, index: number) => {
      if (file.size > maxSizeBytes) {
        setUploads((prev) =>
          prev.map((upload, i) =>
            i === index
              ? { ...upload, status: "error", error: fileTooLargeMsg }
              : upload,
          ),
        );
        toastManager.add({
          title: fileTooLargeMsg,
          type: "error",
          timeout: 5000,
        });
        return;
      }

      startTransition(async () => {
        try {
          setUploads((prev) =>
            prev.map((upload, i) =>
              i === index ? { ...upload, status: "uploading" } : upload,
            ),
          );

          const formData = new FormData();
          formData.append("file", file);
          const result = await uploadProjectMediaFile(
            { projectId, domainId, projectPublicId },
            formData,
          );

          setUploads((prev) =>
            prev.map((upload, i) =>
              i === index ? { ...upload, status: "done", result } : upload,
            ),
          );
          toastManager.add({
            title: uploadSuccessMsg,
            type: "success",
            timeout: 3000,
          });
          onUploadComplete?.([result]);
        } catch (error) {
          const message = parseUploadError(error, uploadFailedMsg);
          setUploads((prev) =>
            prev.map((upload, i) =>
              i === index
                ? { ...upload, status: "error", error: message }
                : upload,
            ),
          );
          toastManager.add({ title: message, type: "error", timeout: 5000 });
        }
      });
    },
    [
      domainId,
      fileTooLargeMsg,
      maxSizeBytes,
      onUploadComplete,
      projectId,
      projectPublicId,
      uploadFailedMsg,
      uploadSuccessMsg,
    ],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const selected = Array.from(files).slice(0, multiple ? files.length : 1);
      const startIndex = uploads.length;
      const nextUploads = selected.map(
        (file): FileUploadState => ({
          file,
          status: "pending",
        }),
      );

      setUploads((prev) => [...prev, ...nextUploads]);
      selected.forEach((file, index) => uploadFile(file, startIndex + index));
    },
    [multiple, uploadFile, uploads.length],
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "border-input bg-muted/30 flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center transition-colors",
          isDragging && "border-primary bg-primary/5",
        )}
      >
        <Upload className="text-muted-foreground size-8" />
        <p className="mt-3 text-sm font-medium">{dropLabel}</p>
        <p className="text-muted-foreground mt-1 text-xs">{orLabel}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
          {selectLabel}
        </Button>
        <p className="text-muted-foreground mt-3 text-xs">{maxSizeLabel}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {uploads.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {uploads.map((upload, index) => (
            <li
              key={`${upload.file.name}-${index}`}
              className="flex items-center gap-3 px-3 py-2 text-sm"
            >
              <FileIcon className="text-muted-foreground size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{upload.file.name}</p>
                <p className="text-muted-foreground text-xs">
                  {formatFileSize(upload.file.size)}
                </p>
                {upload.error && (
                  <p className="text-destructive text-xs">{upload.error}</p>
                )}
              </div>
              {upload.status === "uploading" && (
                <Loader2 className="text-muted-foreground size-4 animate-spin" />
              )}
              {upload.status === "done" && (
                <CheckCircle2 className="text-primary size-4" />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={removeLabel}
                onClick={() => removeUpload(index)}
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
