"use client";

import { createUsePuck } from "@puckeditor/core";
import { Redo2, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import type { PuckConfig } from "@/features/page-builder/puck/config";

const usePuckSelector = createUsePuck<PuckConfig>();

type Props = {
  rightSlot: HTMLElement | null;
};

export function PuckToolbarPortal({ rightSlot }: Props) {
  const t = useTranslations("pageBuilder.pageBuilder");
  const historyIndex = usePuckSelector((state) => state.history.index);
  const historiesLength = usePuckSelector(
    (state) => state.history.histories.length,
  );
  const historyBack = usePuckSelector((state) => state.history.back);
  const historyForward = usePuckSelector((state) => state.history.forward);
  const hasPast = historyIndex > 0;
  const hasFuture = historyIndex < historiesLength - 1;

  const undoRedo = (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={!hasPast}
        title={t("undo")}
        onClick={() => historyBack()}
      >
        <Undo2 />
        <span className="sr-only">{t("undo")}</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={!hasFuture}
        title={t("redo")}
        onClick={() => historyForward()}
      >
        <Redo2 />
        <span className="sr-only">{t("redo")}</span>
      </Button>
    </div>
  );

  return <>{rightSlot ? createPortal(undoRedo, rightSlot) : null}</>;
}
