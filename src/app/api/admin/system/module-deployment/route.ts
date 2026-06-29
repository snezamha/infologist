import { requireSuperAdmin } from "@/lib/auth/rbac";
import { moduleImportErrorMessages } from "@/features/_core/module-error-messages";

const messages = {
  en: {
    lang: "en",
    dir: "ltr",
    title: "Updating modules",
    description: "The new application version is being built and deployed.",
    failed: "Deployment failed",
    missingDependencies: "Required modules are not available: {deps}",
    retry: "Return",
  },
  de: {
    lang: "de",
    dir: "ltr",
    title: "Module werden aktualisiert",
    description: "Die neue Anwendungsversion wird erstellt und bereitgestellt.",
    failed: "Bereitstellung fehlgeschlagen",
    missingDependencies: "Erforderliche Module sind nicht verfügbar: {deps}",
    retry: "Zurück",
  },
  fa: {
    lang: "fa",
    dir: "rtl",
    title: "در حال بروزرسانی ماژول‌ها",
    description: "نسخه جدید برنامه در حال ساخت و استقرار است.",
    failed: "استقرار ناموفق بود",
    missingDependencies: "ماژول‌های مورد نیاز در دسترس نیستند: {deps}",
    retry: "بازگشت",
  },
} as const;

type Locale = keyof typeof messages;

function getLocale(redirect: string): Locale {
  const locale = redirect.replace(/^\//, "").split("/")[0];
  return locale === "fa" || locale === "de" ? locale : "en";
}

function getSafeRedirect(requestUrl: string, redirect: string | null) {
  if (!redirect) return "/";
  try {
    const request = new URL(requestUrl);
    const destination = new URL(redirect, request);
    return destination.origin === request.origin
      ? `${destination.pathname}${destination.search}${destination.hash}`
      : "/";
  } catch {
    return "/";
  }
}

function renderPage(deploymentId: string, redirect: string, locale: Locale) {
  const t = messages[locale];
  const statusUrl = JSON.stringify(
    `/api/admin/module-deployments/${deploymentId}`,
  );
  const redirectUrl = JSON.stringify(redirect);
  const missingDependenciesPrefix =
    moduleImportErrorMessages.missingDependenciesPrefix;
  return `<!doctype html><html lang="${t.lang}" dir="${t.dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t.title}</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#09090b;color:#fafafa;font-family:system-ui,sans-serif}.card{width:min(440px,90vw);padding:32px;border:1px solid #27272a;border-radius:14px;background:#18181b;text-align:center}h1{font-size:18px;margin:0 0 8px}p{font-size:13px;color:#a1a1aa;margin:0 0 24px;line-height:1.7}.track{height:7px;background:#27272a;border-radius:99px;overflow:hidden}.fill{height:100%;width:5%;background:#3b82f6;transition:width .35s}.percent{margin-top:9px;color:#71717a;font-size:12px}.error{display:none;margin-top:18px;padding:12px;border:1px solid #7f1d1d;border-radius:8px;color:#fca5a5;font-size:12px;white-space:pre-wrap}.back{display:none;margin:16px auto 0;padding:9px 18px;border:0;border-radius:7px;background:#3b82f6;color:white;cursor:pointer}</style></head><body><main class="card"><h1>${t.title}</h1><p>${t.description}</p><div class="track"><div class="fill" id="fill"></div></div><div class="percent" id="percent">5%</div><div class="error" id="error"></div><button class="back" id="back">${t.retry}</button></main><script>var statusUrl=${statusUrl};var redirectUrl=${redirectUrl};var fill=document.getElementById("fill");var percent=document.getElementById("percent");var errorBox=document.getElementById("error");var back=document.getElementById("back");back.onclick=function(){location.href=redirectUrl};function formatError(message){if(message.indexOf(${JSON.stringify(missingDependenciesPrefix)})===0){return ${JSON.stringify(t.missingDependencies)}.replace("{deps}",message.slice(${JSON.stringify(missingDependenciesPrefix)}.length))}return message}function poll(){fetch(statusUrl,{cache:"no-store"}).then(function(response){if(!response.ok)throw new Error();return response.json()}).then(function(job){fill.style.width=job.progress+"%";percent.textContent=job.progress+"%";if(job.status==="succeeded"){fill.style.width="100%";percent.textContent="100%";setTimeout(function(){location.replace(redirectUrl)},800);return}if(job.status==="failed"){errorBox.style.display="block";errorBox.textContent=${JSON.stringify(t.failed)}+(job.error?"\n"+formatError(job.error):"");back.style.display="block";return}setTimeout(poll,1500)}).catch(function(){setTimeout(poll,1500)})}poll()</script></body></html>`;
}

export async function GET(request: Request) {
  await requireSuperAdmin();
  const url = new URL(request.url);
  const deploymentId = url.searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/.test(deploymentId)) {
    return new Response("Invalid deployment", { status: 400 });
  }
  const redirect = getSafeRedirect(
    request.url,
    url.searchParams.get("redirect"),
  );
  return new Response(renderPage(deploymentId, redirect, getLocale(redirect)), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
