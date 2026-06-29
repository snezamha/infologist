import type { PuckMetadata } from "@/features/page-builder/puck/localization";

export type PuckRenderProps = {
  id: string;
  puck: {
    isEditing: boolean;
    metadata: Partial<PuckMetadata>;
  };
};
