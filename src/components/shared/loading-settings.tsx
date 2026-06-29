"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { LoadingSpinner } from "@/components/loading/loading-spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  getLoadingSpinnerPath,
  loadingSpinnerCatalog,
  type LoadingSpinnerGroup,
  type LoadingSpinnerId,
} from "@/lib/loading-spinners";
import {
  loadingColorModeOptions,
  loadingPositionOptions,
  sanitizeLoadingColor,
  sanitizeLoadingSpinner,
  type LoadingColorMode,
  type LoadingPosition,
} from "@/lib/site-settings/shared";
import { cn } from "@/lib/utils";

import type { SettingsSectionProps } from "@/components/shared/settings-form";

const groups: LoadingSpinnerGroup[] = [
  "rings",
  "dots",
  "bars",
  "blocks",
  "pulses",
  "other",
];

export function LoadingSettings({ form, set }: SettingsSectionProps) {
  const t = useTranslations("settings");
  const [spinnerModalOpen, setSpinnerModalOpen] = useState(false);
  const spinner =
    sanitizeLoadingSpinner(form.loadingSpinner) ?? "90-ring-with-bg";
  const colorMode = form.loadingColorMode;
  const loadingColorPreview =
    sanitizeLoadingColor(form.loadingColor) ?? "#2563eb";

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Switch
          id="loadingEnabled"
          checked={form.loadingEnabled}
          onCheckedChange={(checked) => set("loadingEnabled", checked)}
        />
        <div className="space-y-1">
          <Label htmlFor="loadingEnabled">
            {t("appearance.loading.enabled")}
          </Label>
          <p className="text-muted-foreground text-xs">
            {t("appearance.loading.description")}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid gap-3">
          <div className="space-y-1">
            <Label>{t("appearance.loading.spinner")}</Label>
            <p className="text-muted-foreground text-xs">
              {t("appearance.loading.spinnerDescription")}
            </p>
          </div>
          <Modal
            open={spinnerModalOpen}
            onOpenChange={setSpinnerModalOpen}
            title={t("appearance.loading.spinnerModalTitle")}
            description={t("appearance.loading.spinnerModalDescription")}
            contentClassName="max-h-[min(720px,calc(100dvh-2rem))] max-w-3xl overflow-hidden"
            bodyClassName="min-h-0 overflow-y-auto pe-1"
            trigger={
              <Button variant="outline" className="w-full sm:w-fit">
                <LoadingSpinner
                  spinner={spinner}
                  colorMode={colorMode}
                  color={loadingColorPreview}
                  size={20}
                />
                {t("appearance.loading.chooseSpinner")}
              </Button>
            }
          >
            <div className="space-y-4">
              {groups.map((group) => {
                const items = loadingSpinnerCatalog.filter(
                  (item) => item.group === group,
                );

                if (items.length === 0) {
                  return null;
                }

                return (
                  <div key={group} className="space-y-2">
                    <p className="text-muted-foreground text-xs font-medium uppercase">
                      {t(`appearance.loading.groups.${group}`)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          aria-label={t("appearance.loading.selectSpinner", {
                            spinner: item.id,
                          })}
                          aria-pressed={spinner === item.id}
                          onClick={() => {
                            set("loadingSpinner", item.id as LoadingSpinnerId);
                            setSpinnerModalOpen(false);
                          }}
                          className={cn(
                            "border-border bg-background hover:bg-muted/50 grid size-9 place-items-center rounded-lg border transition-colors",
                            spinner === item.id &&
                              "border-primary ring-primary/30 ring-2",
                          )}
                        >
                          <Image
                            src={getLoadingSpinnerPath(item.id)}
                            alt=""
                            width={24}
                            height={24}
                            className="size-6 dark:invert"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Modal>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="loadingPosition">
            {t("appearance.loading.position")}
          </Label>
          <Select
            value={form.loadingPosition}
            onValueChange={(nextValue) => {
              if (nextValue) {
                set("loadingPosition", nextValue as LoadingPosition);
              }
            }}
          >
            <SelectTrigger id="loadingPosition" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {loadingPositionOptions.map((position) => (
                <SelectItem key={position} value={position}>
                  {t(`appearance.loading.positions.${position}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="loadingSize">{t("appearance.loading.size")}</Label>
          <Input
            id="loadingSize"
            type="number"
            min={32}
            max={128}
            step={4}
            value={form.loadingSize}
            onChange={(event) => set("loadingSize", Number(event.target.value))}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid gap-3">
          <div className="space-y-1">
            <Label htmlFor="loadingColorMode">
              {t("appearance.loading.colorMode")}
            </Label>
            <p className="text-muted-foreground text-xs">
              {t("appearance.loading.colorModeDescription")}
            </p>
          </div>
          <Select
            value={colorMode}
            onValueChange={(nextValue) => {
              if (nextValue) {
                set("loadingColorMode", nextValue as LoadingColorMode);
              }
            }}
          >
            <SelectTrigger id="loadingColorMode" className="sm:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {loadingColorModeOptions.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {t(`appearance.loading.colorModes.${mode}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {colorMode === "custom" && (
          <div className="space-y-1.5">
            <Label htmlFor="loadingColor">
              {t("appearance.loading.color")}
            </Label>
            <Input
              id="loadingColor"
              type="color"
              value={loadingColorPreview}
              onChange={(event) => set("loadingColor", event.target.value)}
              className="h-10 w-full p-1"
            />
          </div>
        )}
      </div>
    </div>
  );
}
