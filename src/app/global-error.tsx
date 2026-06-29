"use client";

import commonMessages from "@/messages/en/common.json";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

const errorMessages = commonMessages.error;

export default function GlobalError({ reset }: Props) {
  return (
    <html lang="en" dir="ltr">
      <body className="bg-background text-foreground antialiased">
        <main className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg space-y-6 rounded-xl border p-8 text-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">{errorMessages.title}</h1>
              <p className="text-sm opacity-70">{errorMessages.description}</p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="bg-foreground text-background inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium"
            >
              {errorMessages.retry}
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
