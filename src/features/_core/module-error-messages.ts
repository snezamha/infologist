export const moduleImportErrorMessages = {
  invalidArchive: "Invalid module archive",
  emptyArchive: "Module archive is empty",
  tooManyFiles: "Module archive contains too many files",
  invalidPath: "Module archive contains an invalid path",
  unavailableSize: "Module archive size is unavailable",
  tooLarge: "Expanded module archive is too large",
  missingManifest: "Module archive must contain module.json",
  invalidManifest: "Invalid module manifest",
  tooLargeRequest: "Module archive must be between 1 byte and 25 MB",
  missingDependenciesPrefix: "Required modules are not available: ",
} as const;

export const moduleActionErrorMessages = {
  missingDependenciesPrefix: "Module ",
  missingDependenciesSuffix: " requires active modules: ",
  dependentModulesSuffix:
    " cannot be deactivated because active modules depend on it: ",
  dependentDeleteSuffix:
    " cannot be deleted because active modules depend on it: ",
  moduleNotAvailable: "Module is not available",
  moduleServerConfigUnavailable: "Module server configuration is not available",
  projectDatabaseNotConfigured: "Project database is not configured",
} as const;
