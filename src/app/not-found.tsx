import type { Metadata } from "next";

import { NotFoundView } from "@/components/not-found-view";
import commonMessages from "@/messages/en/common.json";

const notFoundMessages = commonMessages.notFound;

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `404 - ${notFoundMessages.title}`,
};

export default function NotFound() {
  return (
    <NotFoundView
      title={notFoundMessages.title}
      description={notFoundMessages.description}
      goBackLabel={notFoundMessages.goBack}
      backHomeLabel={notFoundMessages.backHome}
    />
  );
}
