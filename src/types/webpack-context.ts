interface WebpackRequireContext {
  keys(): string[];
  (id: string): unknown;
}

export {};

declare global {
  interface NodeRequire {
    context(
      directory: string,
      useSubdirectories?: boolean,
      regExp?: RegExp,
    ): WebpackRequireContext;
  }
}
