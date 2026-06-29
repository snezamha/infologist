(function () {
  try {
    if (document.querySelector("[data-track-exclude]")) return;
    var domainId = window.__projectDomain;
    if (!domainId) return;
    var path = location.pathname;
    if (
      /\/(auth|unauthorized|forbidden|server-error)(\/|$)/.test(path) ||
      /\/dashboard(\/|$)/.test(path)
    )
      return;
    if (window.__trackerSent) return;
    window.__trackerSent = true;
    var entryTime = Date.now();
    var lastActiveAt = entryTime;
    var totalActivityMs = 0;
    var recordId = null;
    var visitorId;
    try {
      visitorId = sessionStorage.getItem("_vid");
      if (!visitorId) {
        visitorId = crypto.randomUUID ? crypto.randomUUID() : "v-" + Date.now();
        sessionStorage.setItem("_vid", visitorId);
      }
    } catch {
      visitorId = "v-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    }
    function getPayload(extra) {
      return Object.assign(
        {
          domainId: domainId,
          path: location.pathname,
          url: location.href,
          referrer: document.referrer || "Direct",
          userAgent: navigator.userAgent,
          visitorId: visitorId,
          entryTime: entryTime,
        },
        extra || {},
      );
    }
    function sendTrack(payload, isHeartbeat) {
      var body = Object.assign({}, payload);
      if (isHeartbeat) body.heartbeat = true;
      if (recordId) body.id = recordId;
      fetch("/api/statistics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      })
        .then(function (r) {
          return r.ok ? r.json() : undefined;
        })
        .then(function (d) {
          if (d && d.id) recordId = d.id;
        })
        .catch(function () {});
    }
    var heartbeatInterval;
    function startHeartbeat() {
      if (heartbeatInterval) return;
      heartbeatInterval = setInterval(function () {
        if (document.visibilityState === "visible" && recordId) {
          flushActiveTime();
          sendTrack(
            getPayload({
              totalActivityTime: Math.round(totalActivityMs / 1000),
            }),
            true,
          );
        }
      }, 15000);
    }
    function stopHeartbeat() {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    }
    function flushActiveTime() {
      if (document.visibilityState === "visible") {
        totalActivityMs += Date.now() - lastActiveAt;
        lastActiveAt = Date.now();
      }
    }
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        flushActiveTime();
        if (recordId) {
          sendTrack(
            getPayload({
              totalActivityTime: Math.round(totalActivityMs / 1000),
            }),
            true,
          );
        }
        stopHeartbeat();
      } else {
        lastActiveAt = Date.now();
        startHeartbeat();
      }
    });
    if (document.visibilityState === "visible") startHeartbeat();
    window.addEventListener("pagehide", function () {
      flushActiveTime();
      sendTrack(
        getPayload({
          exitTime: Date.now(),
          totalActivityTime: Math.round(totalActivityMs / 1000),
        }),
      );
    });
    sendTrack(getPayload());
  } catch {}
})();
