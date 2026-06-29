"use client";

import { CustomDomainCard } from "@/components/shared/custom-domain-card";
import {
  saveSiteCustomDomain,
  verifySiteCustomDomain,
} from "@/app/site/[domainId]/dashboard/settings/_actions/site-custom-domain-actions";

type Props = {
  domainId: string;
  publicId: string;
  initialCustomDomain: string | null;
  initialVerifiedAt: Date | null;
};

export function SiteCustomDomainCard({
  domainId,
  publicId,
  initialCustomDomain,
  initialVerifiedAt,
}: Props) {
  return (
    <CustomDomainCard
      publicId={publicId}
      initialCustomDomain={initialCustomDomain}
      initialVerifiedAt={initialVerifiedAt}
      onSave={(domain) => saveSiteCustomDomain(domainId, domain)}
      onVerify={() => verifySiteCustomDomain(domainId)}
    />
  );
}
