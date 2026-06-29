"use client";

import { useRef, useState, useTransition } from "react";
import {
  Copy,
  Crop as CropIcon,
  Download,
  FlipHorizontal,
  FlipVertical,
  Maximize,
  Redo2,
  RotateCw,
  Undo2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import ReactCrop, { type Crop } from "react-image-crop";

import { DashboardFormField } from "@/components/dashboard/form-field";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { DashboardSectionCard } from "@/components/dashboard/section-card";
import { useSiteDateTimeFormat } from "@/components/providers/datetime-format-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  formatFileSize,
  isImageMimeType,
  type MediaAsset,
} from "@/features/media/lib";
import {
  updateProjectMediaImage,
  updateProjectMediaMetadata,
} from "@/features/media/_actions";
import { toastManager } from "@/lib/toast-manager";
import { cn } from "@/lib/utils";

type EditState = {
  crop: Crop | undefined;
  rotation: number;
  flipX: number;
  flipY: number;
  targetWidth: string;
  targetHeight: string;
};

type Props = {
  projectId?: string;
  domainId?: string;
  file: MediaAsset | null;
};

const initialEditState: EditState = {
  crop: undefined,
  rotation: 0,
  flipX: 1,
  flipY: 1,
  targetWidth: "",
  targetHeight: "",
};

function getAbsoluteUrl(path: string) {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

export function MediaEditView({
  projectId,
  domainId,
  file: initialFile,
}: Props) {
  const t = useTranslations("media");
  const { formatDateTime } = useSiteDateTimeFormat();
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState(initialFile);
  const [alt, setAlt] = useState(initialFile?.alt ?? "");
  const [caption, setCaption] = useState(initialFile?.caption ?? "");
  const [description, setDescription] = useState(
    initialFile?.description ?? "",
  );
  const [credit, setCredit] = useState(initialFile?.credit ?? "");
  const [naturalWidth, setNaturalWidth] = useState<number | null>(null);
  const [naturalHeight, setNaturalHeight] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(1);
  const [flipY, setFlipY] = useState(1);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [resizeDialogOpen, setResizeDialogOpen] = useState(false);
  const [targetWidth, setTargetWidth] = useState("");
  const [targetHeight, setTargetHeight] = useState("");
  const [editHistory, setEditHistory] = useState<EditState[]>([
    initialEditState,
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistoryState = (nextState: EditState) => {
    const history = editHistory.slice(0, historyIndex + 1);
    history.push(nextState);
    setEditHistory(history);
    setHistoryIndex(history.length - 1);
  };

  const resetEditState = () => {
    setIsEditingImage(false);
    setRotation(0);
    setFlipX(1);
    setFlipY(1);
    setCrop(undefined);
    setTargetWidth("");
    setTargetHeight("");
    setEditHistory([initialEditState]);
    setHistoryIndex(0);
  };

  if (!file) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      </div>
    );
  }

  const actionContext = { projectId, domainId, fileId: file.id };
  const permalink = getAbsoluteUrl(file.publicUrl);

  const saveImageEdits = async () => {
    if (!imgRef.current || !file) return null;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const activeCrop = crop && crop.width > 0 && crop.height > 0 ? crop : null;

    if (activeCrop) {
      canvas.width = activeCrop.width * scaleX;
      canvas.height = activeCrop.height * scaleY;
      const srcX =
        flipX === -1
          ? image.naturalWidth - (activeCrop.x + activeCrop.width) * scaleX
          : activeCrop.x * scaleX;
      const srcY =
        flipY === -1
          ? image.naturalHeight - (activeCrop.y + activeCrop.height) * scaleY
          : activeCrop.y * scaleY;
      ctx.drawImage(
        image,
        srcX,
        srcY,
        activeCrop.width * scaleX,
        activeCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    } else if (rotation !== 0 || flipX !== 1 || flipY !== 1) {
      if (rotation % 180 !== 0) {
        canvas.width = image.naturalHeight;
        canvas.height = image.naturalWidth;
      } else {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
      }
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipX, flipY);
      ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    } else if (targetWidth && targetHeight) {
      canvas.width = Number(targetWidth);
      canvas.height = Number(targetHeight);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    } else {
      return null;
    }

    const mimeType = file.mimeType || "image/jpeg";
    const base64Data = canvas.toDataURL(mimeType, 0.9);
    const newSize = Math.round((base64Data.length * 3) / 4);
    return updateProjectMediaImage(
      actionContext,
      base64Data,
      mimeType,
      newSize,
    );
  };

  const handleUpdate = () => {
    startTransition(async () => {
      try {
        const imageResult =
          isEditingImage && imgRef.current ? await saveImageEdits() : null;
        const metadataResult = await updateProjectMediaMetadata(actionContext, {
          alt,
          caption,
          description,
          credit,
        });
        setFile(metadataResult ?? imageResult ?? file);
        resetEditState();
        toastManager.add({
          title: t("imageSaved"),
          type: "success",
          timeout: 3000,
        });
      } catch (error) {
        toastManager.add({
          title: error instanceof Error ? error.message : t("error"),
          type: "error",
          timeout: 5000,
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={t("editTitle")} description={file.filename} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <DashboardSectionCard title={t("permalink")}>
            <div className="flex items-center gap-3">
              <p
                className="text-muted-foreground min-w-0 flex-1 truncate font-mono text-sm"
                dir="ltr"
              >
                {permalink}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={async () => {
                  await navigator.clipboard.writeText(permalink);
                  toastManager.add({
                    title: t("copySuccess"),
                    type: "success",
                    timeout: 3000,
                  });
                }}
              >
                <Copy className="size-4" />
                {t("copy")}
              </Button>
            </div>
          </DashboardSectionCard>

          {isImageMimeType(file.mimeType) ? (
            <DashboardSectionCard title={t("editTitle")}>
              {!isEditingImage ? (
                <div className="space-y-4">
                  <div
                    className="aspect-video rounded-lg bg-cover bg-center"
                    style={{ backgroundImage: `url(${file.publicUrl})` }}
                  />
                  <Button type="button" onClick={() => setIsEditingImage(true)}>
                    {t("editTitle")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        rotation !== 0 || Boolean(targetWidth && targetHeight)
                      }
                      onClick={() =>
                        setCrop({
                          unit: "%",
                          width: 50,
                          height: 50,
                          x: 25,
                          y: 25,
                        })
                      }
                    >
                      <CropIcon className="size-4" />
                      {t("crop")}
                    </Button>
                    <Dialog
                      open={resizeDialogOpen}
                      onOpenChange={setResizeDialogOpen}
                    >
                      <DialogTrigger
                        render={
                          <Button type="button" variant="outline" size="sm" />
                        }
                      >
                        <Maximize className="size-4" />
                        {t("scale")}
                      </DialogTrigger>
                      <DialogContent closeLabel={t("cancel")}>
                        <DialogHeader>
                          <DialogTitle>{t("scale")}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4">
                          <DashboardFormField
                            id="targetWidth"
                            label={t("widthPx")}
                          >
                            <Input
                              id="targetWidth"
                              value={targetWidth}
                              onChange={(event) =>
                                setTargetWidth(event.target.value)
                              }
                              dir="ltr"
                            />
                          </DashboardFormField>
                          <DashboardFormField
                            id="targetHeight"
                            label={t("heightPx")}
                          >
                            <Input
                              id="targetHeight"
                              value={targetHeight}
                              onChange={(event) =>
                                setTargetHeight(event.target.value)
                              }
                              dir="ltr"
                            />
                          </DashboardFormField>
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            onClick={() => {
                              setResizeDialogOpen(false);
                              pushHistoryState({
                                crop,
                                rotation,
                                flipX,
                                flipY,
                                targetWidth,
                                targetHeight,
                              });
                            }}
                          >
                            {t("applyChanges")}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextRotation = (rotation + 90) % 360;
                        setRotation(nextRotation);
                        pushHistoryState({
                          crop,
                          rotation: nextRotation,
                          flipX,
                          flipY,
                          targetWidth,
                          targetHeight,
                        });
                      }}
                    >
                      <RotateCw className="size-4" />
                      {t("rotation")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextFlip = flipY === 1 ? -1 : 1;
                        setFlipY(nextFlip);
                        pushHistoryState({
                          crop,
                          rotation,
                          flipX,
                          flipY: nextFlip,
                          targetWidth,
                          targetHeight,
                        });
                      }}
                    >
                      <FlipVertical className="size-4" />
                      {t("flipVertical")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextFlip = flipX === 1 ? -1 : 1;
                        setFlipX(nextFlip);
                        pushHistoryState({
                          crop,
                          rotation,
                          flipX: nextFlip,
                          flipY,
                          targetWidth,
                          targetHeight,
                        });
                      }}
                    >
                      <FlipHorizontal className="size-4" />
                      {t("flipHorizontal")}
                    </Button>
                  </div>

                  <ReactCrop
                    crop={crop}
                    onChange={setCrop}
                    onComplete={(c) => {
                      if (c.width > 0 && c.height > 0) {
                        pushHistoryState({
                          crop: c,
                          rotation,
                          flipX,
                          flipY,
                          targetWidth,
                          targetHeight,
                        });
                      }
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imgRef}
                      src={file.publicUrl}
                      alt={alt || file.filename}
                      crossOrigin="anonymous"
                      className={cn("max-h-[32rem] w-full object-contain")}
                      style={{
                        transform: `rotate(${rotation}deg) scaleX(${flipX}) scaleY(${flipY})`,
                      }}
                      onLoad={(event) => {
                        if (naturalWidth && naturalHeight) return;
                        setNaturalWidth(event.currentTarget.naturalWidth);
                        setNaturalHeight(event.currentTarget.naturalHeight);
                      }}
                    />
                  </ReactCrop>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={historyIndex === 0}
                      onClick={() => {
                        if (historyIndex > 0) {
                          const state = editHistory[historyIndex - 1]!;
                          setCrop(state.crop);
                          setRotation(state.rotation);
                          setFlipX(state.flipX);
                          setFlipY(state.flipY);
                          setTargetWidth(state.targetWidth);
                          setTargetHeight(state.targetHeight);
                          setHistoryIndex(historyIndex - 1);
                        }
                      }}
                    >
                      <Undo2 className="size-4" />
                      {t("undo")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={historyIndex === editHistory.length - 1}
                      onClick={() => {
                        if (historyIndex < editHistory.length - 1) {
                          const state = editHistory[historyIndex + 1]!;
                          setCrop(state.crop);
                          setRotation(state.rotation);
                          setFlipX(state.flipX);
                          setFlipY(state.flipY);
                          setTargetWidth(state.targetWidth);
                          setTargetHeight(state.targetHeight);
                          setHistoryIndex(historyIndex + 1);
                        }
                      }}
                    >
                      <Redo2 className="size-4" />
                      {t("redo")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetEditState}
                    >
                      {t("cancelEditing")}
                    </Button>
                    <Button
                      type="button"
                      disabled={isPending}
                      onClick={handleUpdate}
                    >
                      {isPending ? t("saving") : t("saveEdits")}
                    </Button>
                  </div>
                </div>
              )}
            </DashboardSectionCard>
          ) : (
            <DashboardSectionCard title={file.filename}>
              <p className="text-muted-foreground text-sm">{file.mimeType}</p>
            </DashboardSectionCard>
          )}

          <DashboardSectionCard title={t("altText")}>
            <div className="space-y-4">
              <DashboardFormField id="alt" label={t("altText")}>
                <Input
                  id="alt"
                  value={alt}
                  onChange={(event) => setAlt(event.target.value)}
                />
              </DashboardFormField>
              <DashboardFormField id="caption" label={t("caption")}>
                <Textarea
                  id="caption"
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  rows={3}
                />
              </DashboardFormField>
              <DashboardFormField id="description" label={t("fileDescription")}>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={6}
                />
              </DashboardFormField>
              <DashboardFormField id="credit" label={t("credit")}>
                <Input
                  id="credit"
                  value={credit}
                  onChange={(event) => setCredit(event.target.value)}
                />
              </DashboardFormField>
              <Button type="button" disabled={isPending} onClick={handleUpdate}>
                {isPending ? t("saving") : t("update")}
              </Button>
            </div>
          </DashboardSectionCard>
        </div>

        <DashboardSectionCard title={t("fileInfo")}>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">{t("uploadedOn")}</dt>
              <dd>{formatDateTime(file.createdAt)}</dd>
            </div>
            {file.uploadedBy ? (
              <div>
                <dt className="text-muted-foreground">{t("uploadedBy")}</dt>
                <dd>{file.uploadedBy.name || file.uploadedBy.email}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted-foreground">{t("fileUrl")}</dt>
              <dd className="break-all font-mono text-xs" dir="ltr">
                {file.publicUrl}
              </dd>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(file.publicUrl);
                  toastManager.add({
                    title: t("copySuccess"),
                    type: "success",
                    timeout: 3000,
                  });
                }}
              >
                <Copy className="size-4" />
                {t("copy")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<a href={file.publicUrl} download={file.filename} />}
              >
                <Download className="size-4" />
                {t("download")}
              </Button>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("fileType")}</dt>
              <dd>{file.mimeType}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("fileSize")}</dt>
              <dd>{formatFileSize(file.size)}</dd>
            </div>
            {naturalWidth && naturalHeight ? (
              <div>
                <dt className="text-muted-foreground">{t("dimensions")}</dt>
                <dd dir="ltr">
                  {naturalWidth} x {naturalHeight}
                </dd>
              </div>
            ) : null}
          </dl>
        </DashboardSectionCard>
      </div>
    </div>
  );
}
