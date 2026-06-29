"use client";

import { useEffect, useRef } from "react";
import { type PageTheme, themeToCSS } from "./puck-theme-editor";

const STYLE_ID = "puck-page-theme";

function injectIntoFrame(frame: HTMLIFrameElement, css: string) {
  const doc = frame.contentDocument;
  if (!doc?.head) return;
  let el = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = doc.createElement("style");
    el.id = STYLE_ID;
    doc.head.appendChild(el);
  }
  if (el.textContent !== css) el.textContent = css;
}

function injectTheme(css: string) {
  document
    .querySelectorAll<HTMLIFrameElement>("iframe#preview-frame")
    .forEach((f) => injectIntoFrame(f, css));
}

type Props = { theme: PageTheme };

export function PuckThemeInjector({ theme }: Props) {
  const cssRef = useRef("");

  useEffect(() => {
    cssRef.current = themeToCSS(theme);
    injectTheme(cssRef.current);
  }, [theme]);

  useEffect(() => {
    function onLoad(e: Event) {
      const t = e.target;
      if (t instanceof HTMLIFrameElement && t.id === "preview-frame") {
        injectTheme(cssRef.current);
      }
    }
    document.addEventListener("load", onLoad, true);

    const observer = new MutationObserver(() => {
      const frame = document.querySelector<HTMLIFrameElement>(
        "iframe#preview-frame",
      );
      if (frame) injectIntoFrame(frame, cssRef.current);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("load", onLoad, true);
      observer.disconnect();
    };
  }, []);

  return null;
}
