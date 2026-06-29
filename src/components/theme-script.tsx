"use client";

import { useServerInsertedHTML } from "next/navigation";

const SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var c=d?'dark':'light';var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(c);r.style.colorScheme=c}catch{}})();`;

export function ThemeScript() {
  useServerInsertedHTML(() => (
    <script id="theme-script" dangerouslySetInnerHTML={{ __html: SCRIPT }} />
  ));
  return null;
}
