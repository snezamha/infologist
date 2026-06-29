"use client";

import { ClerkProvider } from "@clerk/nextjs";

type Props = {
  publishableKey: string;
  children: React.ReactNode;
};

export function SiteClerkProvider({ publishableKey, children }: Props) {
  return (
    <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
  );
}
