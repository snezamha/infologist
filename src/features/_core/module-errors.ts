"use client";

import type { useTranslations } from "next-intl";

import {
  moduleActionErrorMessages,
  moduleImportErrorMessages,
} from "@/features/_core/module-error-messages";

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function localizeModuleImportError(
  message: string,
  t: ReturnType<typeof useTranslations>,
): string {
  if (message.startsWith(moduleImportErrorMessages.missingDependenciesPrefix)) {
    return t("features.modules.missingDependencies", {
      deps: message.slice(
        moduleImportErrorMessages.missingDependenciesPrefix.length,
      ),
    });
  }

  const errorMap: Record<string, string> = {
    [moduleImportErrorMessages.invalidArchive]: t(
      "features.modules.importErrors.invalidZip",
    ),
    [moduleImportErrorMessages.emptyArchive]: t(
      "features.modules.importErrors.empty",
    ),
    [moduleImportErrorMessages.tooManyFiles]: t(
      "features.modules.importErrors.tooManyFiles",
    ),
    [moduleImportErrorMessages.invalidPath]: t(
      "features.modules.importErrors.invalidPath",
    ),
    [moduleImportErrorMessages.unavailableSize]: t(
      "features.modules.importErrors.invalidZip",
    ),
    [moduleImportErrorMessages.tooLarge]: t(
      "features.modules.importErrors.tooLarge",
    ),
    [moduleImportErrorMessages.missingManifest]: t(
      "features.modules.importErrors.missingManifest",
    ),
    [moduleImportErrorMessages.invalidManifest]: t(
      "features.modules.importErrors.invalidManifest",
    ),
    [moduleImportErrorMessages.tooLargeRequest]: t(
      "features.modules.importErrors.tooLarge",
    ),
  };

  return errorMap[message] ?? message;
}

export function localizeModuleActionError(
  message: string,
  t: ReturnType<typeof useTranslations>,
): string {
  if (
    message.startsWith(moduleActionErrorMessages.missingDependenciesPrefix) &&
    message.includes(moduleActionErrorMessages.missingDependenciesSuffix)
  ) {
    return t("features.modules.missingDependencies", {
      deps: message.slice(
        message.indexOf(moduleActionErrorMessages.missingDependenciesSuffix) +
          moduleActionErrorMessages.missingDependenciesSuffix.length,
      ),
    });
  }

  if (
    message.startsWith(moduleActionErrorMessages.missingDependenciesPrefix) &&
    message.includes(moduleActionErrorMessages.dependentModulesSuffix)
  ) {
    return t("features.modules.dependentModules", {
      deps: message.slice(
        message.indexOf(moduleActionErrorMessages.dependentModulesSuffix) +
          moduleActionErrorMessages.dependentModulesSuffix.length,
      ),
    });
  }

  if (
    message.startsWith(moduleActionErrorMessages.missingDependenciesPrefix) &&
    message.includes(moduleActionErrorMessages.dependentDeleteSuffix)
  ) {
    return t("features.modules.dependentModules", {
      deps: message.slice(
        message.indexOf(moduleActionErrorMessages.dependentDeleteSuffix) +
          moduleActionErrorMessages.dependentDeleteSuffix.length,
      ),
    });
  }

  if (message === moduleActionErrorMessages.moduleNotAvailable) {
    return t("features.modules.importErrors.moduleNotAvailable");
  }

  if (message === moduleActionErrorMessages.moduleServerConfigUnavailable) {
    return t("features.modules.importErrors.moduleServerConfigUnavailable");
  }

  if (message === moduleActionErrorMessages.projectDatabaseNotConfigured) {
    return t("features.modules.importErrors.projectDatabaseNotConfigured");
  }

  return message;
}
