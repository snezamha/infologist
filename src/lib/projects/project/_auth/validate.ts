import { createClerkClient } from "@clerk/nextjs/server";

type ClerkAuthConfig = {
  clerkPublishableKey: string;
  clerkSecretKey: string;
};

export async function verifyClerkAuthConfig({
  clerkPublishableKey,
  clerkSecretKey,
}: ClerkAuthConfig): Promise<{ valid: boolean; warning?: string }> {
  if (!clerkPublishableKey || !clerkSecretKey) {
    return { valid: true };
  }

  try {
    const clerk = createClerkClient({
      publishableKey: clerkPublishableKey,
      secretKey: clerkSecretKey,
    });

    await Promise.all([
      clerk.instance.get(),
      clerk.apiKeys.verify(clerkSecretKey),
    ]);
    return { valid: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Clerk verification failed";
    console.warn("[verifyClerkAuthConfig] verification warning:", message);
    return {
      valid: true,
      warning: message,
    };
  }
}
