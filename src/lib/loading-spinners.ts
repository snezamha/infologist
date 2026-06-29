export type LoadingSpinnerGroup =
  | "rings"
  | "dots"
  | "bars"
  | "blocks"
  | "pulses"
  | "other";

export type LoadingSpinnerId =
  | "90-ring"
  | "90-ring-with-bg"
  | "180-ring"
  | "180-ring-with-bg"
  | "270-ring"
  | "270-ring-with-bg"
  | "ring-resize"
  | "3-dots-bounce"
  | "3-dots-fade"
  | "3-dots-move"
  | "3-dots-rotate"
  | "3-dots-scale"
  | "3-dots-scale-middle"
  | "6-dots-rotate"
  | "6-dots-scale"
  | "6-dots-scale-middle"
  | "8-dots-rotate"
  | "12-dots-scale-rotate"
  | "dot-revolve"
  | "bars-fade"
  | "bars-scale"
  | "bars-scale-fade"
  | "bars-scale-middle"
  | "bars-rotate-fade"
  | "blocks-scale"
  | "blocks-shuffle-2"
  | "blocks-shuffle-3"
  | "blocks-wave"
  | "pulse"
  | "pulse-2"
  | "pulse-3"
  | "pulse-multiple"
  | "pulse-ring"
  | "pulse-rings-2"
  | "pulse-rings-3"
  | "pulse-rings-multiple"
  | "bouncing-ball"
  | "clock"
  | "eclipse"
  | "eclipse-half"
  | "gooey-balls-1"
  | "gooey-balls-2"
  | "tadpole"
  | "wifi"
  | "wifi-fade"
  | "wind-toy";

export const loadingSpinnerCatalog: ReadonlyArray<{
  id: LoadingSpinnerId;
  group: LoadingSpinnerGroup;
}> = [
  { id: "90-ring", group: "rings" },
  { id: "90-ring-with-bg", group: "rings" },
  { id: "180-ring", group: "rings" },
  { id: "180-ring-with-bg", group: "rings" },
  { id: "270-ring", group: "rings" },
  { id: "270-ring-with-bg", group: "rings" },
  { id: "ring-resize", group: "rings" },
  { id: "3-dots-bounce", group: "dots" },
  { id: "3-dots-fade", group: "dots" },
  { id: "3-dots-move", group: "dots" },
  { id: "3-dots-rotate", group: "dots" },
  { id: "3-dots-scale", group: "dots" },
  { id: "3-dots-scale-middle", group: "dots" },
  { id: "6-dots-rotate", group: "dots" },
  { id: "6-dots-scale", group: "dots" },
  { id: "6-dots-scale-middle", group: "dots" },
  { id: "8-dots-rotate", group: "dots" },
  { id: "12-dots-scale-rotate", group: "dots" },
  { id: "dot-revolve", group: "dots" },
  { id: "bars-fade", group: "bars" },
  { id: "bars-scale", group: "bars" },
  { id: "bars-scale-fade", group: "bars" },
  { id: "bars-scale-middle", group: "bars" },
  { id: "bars-rotate-fade", group: "bars" },
  { id: "blocks-scale", group: "blocks" },
  { id: "blocks-shuffle-2", group: "blocks" },
  { id: "blocks-shuffle-3", group: "blocks" },
  { id: "blocks-wave", group: "blocks" },
  { id: "pulse", group: "pulses" },
  { id: "pulse-2", group: "pulses" },
  { id: "pulse-3", group: "pulses" },
  { id: "pulse-multiple", group: "pulses" },
  { id: "pulse-ring", group: "pulses" },
  { id: "pulse-rings-2", group: "pulses" },
  { id: "pulse-rings-3", group: "pulses" },
  { id: "pulse-rings-multiple", group: "pulses" },
  { id: "bouncing-ball", group: "other" },
  { id: "clock", group: "other" },
  { id: "eclipse", group: "other" },
  { id: "eclipse-half", group: "other" },
  { id: "gooey-balls-1", group: "other" },
  { id: "gooey-balls-2", group: "other" },
  { id: "tadpole", group: "other" },
  { id: "wifi", group: "other" },
  { id: "wifi-fade", group: "other" },
  { id: "wind-toy", group: "other" },
];

export const defaultLoadingSpinner: LoadingSpinnerId = "90-ring-with-bg";

const spinnerIds = new Set<string>(
  loadingSpinnerCatalog.map((item) => item.id),
);

export function isLoadingSpinnerId(value: unknown): value is LoadingSpinnerId {
  return typeof value === "string" && spinnerIds.has(value);
}

export function getLoadingSpinnerPath(id: string) {
  const spinnerId = isLoadingSpinnerId(id) ? id : defaultLoadingSpinner;
  return `/spinners/${spinnerId}.svg`;
}

const svgCache = new Map<string, Promise<string>>();

export function loadLoadingSpinnerSvg(id: string) {
  const spinnerId = isLoadingSpinnerId(id) ? id : defaultLoadingSpinner;
  const cached = svgCache.get(spinnerId);

  if (cached) {
    return cached;
  }

  const request = fetch(getLoadingSpinnerPath(spinnerId)).then(
    async (response) => {
      if (!response.ok) {
        svgCache.delete(spinnerId);
        throw new Error(`Spinner not found: ${spinnerId}`);
      }

      return response.text();
    },
  );

  svgCache.set(spinnerId, request);
  return request;
}

export function preloadLoadingSpinner(id: string) {
  void loadLoadingSpinnerSvg(id).catch(() => undefined);
}
