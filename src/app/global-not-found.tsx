import type { Metadata } from "next";

import { NotFoundView } from "@/components/not-found-view";
import { fontVariables } from "@/config/fonts";
import { cn } from "@/lib/utils";
import commonMessages from "@/messages/en/common.json";

import "@/styles/globals.css";

const notFoundMessages = commonMessages.notFound;

export const metadata: Metadata = {
  title: `404 - ${notFoundMessages.title}`,
};

export default function GlobalNotFound() {
  return (
    <html lang="en" dir="ltr" className={cn(fontVariables, "h-full")}>
      <body
        dir="ltr"
        style={{
          fontFamily: "var(--font-inter), var(--font-vazir)",
        }}
        className="min-h-full antialiased"
      >
        <NotFoundView
          title={notFoundMessages.title}
          description={notFoundMessages.description}
          goBackLabel={notFoundMessages.goBack}
          backHomeLabel={notFoundMessages.backHome}
        />
      </body>
    </html>
  );
}
