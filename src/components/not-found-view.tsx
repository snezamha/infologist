"use client";

import { Button } from "@/components/ui/button";

type NotFoundViewProps = {
  title: string;
  description: string;
  goBackLabel: string;
  backHomeLabel: string;
  homeHref?: string;
};

export function NotFoundView({
  title,
  description,
  goBackLabel,
  backHomeLabel,
  homeHref = "/",
}: NotFoundViewProps) {
  function goBack() {
    window.history.back();
  }

  return (
    <div
      data-track-exclude
      className="text-foreground bg-background flex min-h-screen w-full flex-col items-center justify-center gap-6 px-4 py-10 text-center"
    >
      <div className="flex flex-col-reverse items-center justify-center gap-6 md:flex-row md:text-start">
        <div className="md:me-6">
          <h1 className="text-5xl font-black sm:text-6xl">
            404
            <span className="mt-2 block text-2xl font-semibold sm:text-3xl">
              {title}
            </span>
          </h1>
        </div>
        <div className="flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className="h-32 w-32 sm:h-40 sm:w-40 dark:text-gray-400"
            aria-hidden
          >
            <path
              fill="currentColor"
              d="M256,16C123.452,16,16,123.452,16,256S123.452,496,256,496,496,388.548,496,256,388.548,16,256,16ZM403.078,403.078a207.253,207.253,0,1,1,44.589-66.125A207.332,207.332,0,0,1,403.078,403.078Z"
            />
            <rect width="176" height="32" x="168" y="320" fill="currentColor" />
            <polygon
              fill="currentColor"
              points="210.63 228.042 186.588 206.671 207.958 182.63 184.042 161.37 162.671 185.412 138.63 164.042 117.37 187.958 141.412 209.329 120.042 233.37 143.958 254.63 165.329 230.588 189.37 251.958 210.63 228.042"
            />
            <polygon
              fill="currentColor"
              points="383.958 182.63 360.042 161.37 338.671 185.412 314.63 164.042 293.37 187.958 317.412 209.329 296.042 233.37 319.958 254.63 341.329 230.588 365.37 251.958 386.63 228.042 362.588 206.671 383.958 182.63"
            />
          </svg>
        </div>
      </div>

      <p className="text-muted-foreground text-base sm:text-lg md:text-xl">
        {description}
      </p>

      <div className="mt-8 flex justify-center gap-2">
        <Button onClick={goBack} variant="default" size="lg">
          {goBackLabel}
        </Button>
        <Button
          onClick={() => {
            window.location.assign(homeHref);
          }}
          variant="ghost"
          size="lg"
        >
          {backHomeLabel}
        </Button>
      </div>
    </div>
  );
}
