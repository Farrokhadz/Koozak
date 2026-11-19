// Captures the browser's "install app" prompt so a button can trigger it later.
// Imported from main.jsx so the listener exists before the event can fire.

let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault(); // hold the native mini-bar back; we show our own button
  deferredPrompt = event;
  notify();
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  notify();
});

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const canPrompt = () => deferredPrompt !== null;

export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

// iOS has no install prompt API: the user must use Safari's Share menu.
export const isIos = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
  (window.navigator.platform === "MacIntel" &&
    window.navigator.maxTouchPoints > 1);

/** Shows the native install dialog. Resolves to "accepted" | "dismissed" | "unavailable". */
export async function promptInstall() {
  if (!deferredPrompt) return "unavailable";
  const promptEvent = deferredPrompt;
  deferredPrompt = null; // an event can only be used once
  notify();
  promptEvent.prompt();
  const { outcome } = await promptEvent.userChoice;
  return outcome;
}
