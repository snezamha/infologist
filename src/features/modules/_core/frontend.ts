import type { ReactNode } from "react";

interface ProjectModuleFrontendProps {
  locale: string;
  dir: string;
  siteName: string;
  projectPublicId: string;
  basePath: string;
}

export type ProjectModuleFrontendComponent<
  TProps extends ProjectModuleFrontendProps = ProjectModuleFrontendProps,
> = (props: TProps) => ReactNode | Promise<ReactNode>;
