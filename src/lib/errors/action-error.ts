export type ActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "EMAIL_NOT_ALLOWED"
  | "HAS_CONTENT"
  | "UNAVAILABLE"
  | "UNKNOWN";

export class ActionError extends Error {
  readonly code: ActionErrorCode;

  constructor(code: ActionErrorCode, message: string) {
    super(message);
    this.name = "ActionError";
    this.code = code;
  }
}

export function isActionError(error: unknown): error is ActionError {
  return error instanceof ActionError;
}

export function getActionErrorMessage(
  error: unknown,
  fallback: string,
  localizedMessages?: Record<string, string>,
): string {
  if (error instanceof Error) {
    if (localizedMessages?.[error.message]) {
      return localizedMessages[error.message];
    }
    if (isActionError(error)) {
      return error.message;
    }
  }

  return fallback;
}
