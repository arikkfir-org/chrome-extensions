// Registered by background.js on pages matching the user's patterns: counts down, then asks background.js to close
// this tab, unless the user keeps it open.
(async () => {
  if (window.tabAutoCloserArmed) {
    return;
  }
  window.tabAutoCloserArmed = true;

  // Same default as settings.js, which a content script can't import.
  const { delaySeconds } = await chrome.storage.sync.get({ delaySeconds: 3 });

  const close = () => chrome.runtime.sendMessage({ type: "close" });
  if (delaySeconds <= 0) {
    close();
    return;
  }

  // A shadow root keeps the page's styles off the banner and the banner's off the page.
  const host = document.createElement("div");
  const shadow = host.attachShadow({ mode: "closed" });
  shadow.innerHTML = `
    <style>
      .banner {
        position: fixed; top: 16px; right: 16px; z-index: 2147483647;
        display: flex; align-items: center; gap: 12px; padding: 10px 14px;
        font: 14px/1.4 system-ui, sans-serif; color: #fff; background: #1f2937;
        border-radius: 8px; box-shadow: 0 4px 16px rgb(0 0 0 / 0.3);
      }
      button {
        font: inherit; color: #1f2937; background: #fff; border: 0; border-radius: 6px;
        padding: 4px 10px; cursor: pointer;
      }
    </style>
    <div class="banner" role="status">
      <span>Closing this tab in <b class="seconds"></b> s</span>
      <button type="button">Keep open</button>
    </div>`;
  const seconds = shadow.querySelector(".seconds");
  document.documentElement.append(host);

  let remaining = delaySeconds;
  seconds.textContent = remaining;
  const timer = setInterval(() => {
    remaining -= 1;
    seconds.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(timer);
      close();
    }
  }, 1000);

  shadow.querySelector("button").addEventListener("click", () => {
    clearInterval(timer);
    host.remove();
  });
})();
