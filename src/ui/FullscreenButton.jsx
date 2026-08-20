import { useEffect, useState } from "react";

// Cross-browser fullscreen helpers — iPad Safari still ships the old
// webkit-prefixed API rather than the standard one.
function requestFullscreen(el) {
  const fn = el.requestFullscreen || el.webkitRequestFullscreen;
  if (fn) fn.call(el);
}

function exitFullscreen() {
  const fn = document.exitFullscreen || document.webkitExitFullscreen;
  if (fn) fn.call(document);
}

function currentFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function isSupported() {
  const el = document.documentElement;
  return !!(
    (document.fullscreenEnabled ?? document.webkitFullscreenEnabled) &&
    (el.requestFullscreen || el.webkitRequestFullscreen)
  );
}

// A single small, icon-only control — the deck is meant to be presented,
// and on an iPad that means getting Safari's address bar and chrome out
// of the way without adding anything that competes for attention.
export function FullscreenButton() {
  const [supported] = useState(isSupported);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!supported) return;
    const onChange = () => setActive(!!currentFullscreenElement());
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [supported]);

  if (!supported) return null;

  return (
    <button
      type="button"
      className="nav-arrow"
      onClick={() =>
        currentFullscreenElement()
          ? exitFullscreen()
          : requestFullscreen(document.documentElement)
      }
      aria-label={active ? "Exit full screen" : "Enter full screen"}
      title={active ? "Exit full screen" : "Full screen"}
    >
      {active ? (
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path
            d="M9 3v4a2 2 0 0 1-2 2H3M15 3v4a2 2 0 0 0 2 2h4M9 21v-4a2 2 0 0 0-2-2H3M15 21v-4a2 2 0 0 1 2-2h4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path
            d="M3 9V5a2 2 0 0 1 2-2h4M21 9V5a2 2 0 0 0-2-2h-4M3 15v4a2 2 0 0 0 2 2h4M21 15v4a2 2 0 0 1-2 2h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
