import "server-only";

import { ActionError } from "@/lib/errors/action-error";

const MAX_LOG_CHARS = 500;

export function throwAiProviderError(
  provider: string,
  status: number | undefined,
  rawBody: string,
): never {
  if (status !== undefined) {
    console.error(
      `[ai] ${provider} request failed (status ${status}): ${rawBody.slice(0, MAX_LOG_CHARS)}`,
    );
  }
  throw new ActionError(
    "UNKNOWN",
    status !== undefined
      ? `${provider} request failed (status ${status})`
      : `${provider} request failed`,
  );
}

export function throwAiEmptyResponse(provider: string): never {
  throw new ActionError("UNKNOWN", `${provider} returned an empty response`);
}
