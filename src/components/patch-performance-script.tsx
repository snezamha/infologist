"use client";

import { useServerInsertedHTML } from "next/navigation";

const PATCH =
  "(function(){var o=performance.measure.bind(performance);performance.measure=function(){try{return o.apply(this,arguments)}catch{return undefined}};})();";

export function PatchPerformanceScript() {
  useServerInsertedHTML(() => (
    <script
      id="patch-performance-measure"
      dangerouslySetInnerHTML={{ __html: PATCH }}
    />
  ));
  return null;
}
