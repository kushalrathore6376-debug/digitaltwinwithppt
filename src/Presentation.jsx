import { useCallback, useEffect, useMemo, useState } from "react";
import "./presentation.css";
import { IntroSlide } from "./slides/IntroSlide.jsx";
import { DigitalTwinSlide } from "./slides/DigitalTwinSlide.jsx";
import { ProductsSlide } from "./slides/ProductsSlide.jsx";
import { USPSlide } from "./slides/USPSlide.jsx";
import { ScaleupSlide } from "./slides/ScaleupSlide.jsx";
import { PartnershipSlide } from "./slides/PartnershipSlide.jsx";
import { OurTrialsSlide } from "./slides/OurTrialsSlide.jsx";
import { TeamSlide } from "./slides/TeamSlide.jsx";
import { FullscreenButton } from "./ui/FullscreenButton.jsx";
import { useSimStore } from "./store.js";

const SLIDES = [
  { id: "intro", label: "Intro" },
  { id: "twin", label: "Digital twin" },
  { id: "products", label: "Products" },
  { id: "usp", label: "USP" },
  { id: "scaleup", label: "Scale-up" },
  { id: "partnership", label: "Partnership" },
  { id: "our-trials", label: "Our Trials" },
  { id: "team", label: "Team" },
];

// On phones, show the previous step, the current one, and the next —
// a three-chip window that slides as you move, so the strip never
// overflows or needs a scrollbar.
const MOBILE_NAV_WINDOW = 3;

function useIsMobileNav() {
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 900
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 900px)");
    const update = (e) => setMobile(e.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return mobile;
}

function visibleNavIndices(index, count, windowSize) {
  if (windowSize >= count) {
    return Array.from({ length: count }, (_, i) => i);
  }
  // Center on the current slide when possible: prev | current | next.
  // Near the ends the window clamps so it still fills three chips.
  const half = Math.floor(windowSize / 2);
  let start = index - half;
  if (start < 0) start = 0;
  if (start + windowSize > count) start = count - windowSize;
  return Array.from({ length: windowSize }, (_, i) => start + i);
}

// A lightweight PPT-style shell: a persistent nav bar (so its controls never
// have to fight the digital twin's own on-canvas overlay for screen space)
// and a horizontal carousel of full-height slides underneath it. Navigation
// is deliberately button/keyboard only — wheel and touch-swipe are left
// alone because slide 2 needs them for OrbitControls (zoom and one-finger
// orbit).
export default function Presentation() {
  const [index, setIndex] = useState(0);
  const count = SLIDES.length;
  const mobileNav = useIsMobileNav();

  const goTo = useCallback(
    (next) =>
      setIndex((current) => {
        const clamped = Math.min(count - 1, Math.max(0, next));
        if (clamped === current) return current;
        // The digital twin's <Canvas> sizes itself off a ResizeObserver on
        // its parent. That observer is supposed to fire the moment the
        // parent has a real size, but browsers can drop or throttle that
        // first notification — a backgrounded tab, or just an unlucky race
        // with the slide's own CSS transition. Nudging a window resize once
        // the slide has settled forces a fresh measurement no matter which
        // of those caused it to be missed.
        window.setTimeout(() => window.dispatchEvent(new Event("resize")), 700);
        return clamped;
      }),
    [count]
  );

  const navIndices = useMemo(
    () =>
      mobileNav
        ? visibleNavIndices(index, count, MOBILE_NAV_WINDOW)
        : Array.from({ length: count }, (_, i) => i),
    [mobileNav, index, count]
  );

  useEffect(() => {
    const onKey = (e) => {
      // The digital twin's own stage rail steps with the same arrow keys
      // while its tour is active (see TourDriver.jsx) — both handlers live
      // on `window`, so the slide deck defers to it rather than also
      // changing slides underneath it.
      if (useSimStore.getState().tourActive) return;
      if (e.key === "ArrowRight") goTo(index + 1);
      else if (e.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, goTo]);

  // Browsers throttle ResizeObserver (what the digital twin's <Canvas> uses
  // to size itself) on a tab that starts out hidden or backgrounded — a tab
  // opened behind another window, or restored from a previous session. The
  // canvas is then stuck at its 300x150 default until something forces a
  // fresh measurement. A resize nudge the moment the tab becomes visible
  // covers that without touching the digital twin's own code.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        window.dispatchEvent(new Event("resize"));
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Belt and braces for the same measurement race on first load: a couple
  // of staggered nudges shortly after mount, independent of any visibility
  // change or navigation ever firing.
  useEffect(() => {
    const timers = [200, 800, 2000].map((ms) =>
      window.setTimeout(() => window.dispatchEvent(new Event("resize")), ms)
    );
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <div className="presentation">
      <nav className="presentation-nav" aria-label="Presentation">
        <button
          type="button"
          className="nav-brand"
          onClick={() => goTo(0)}
          aria-label="Go to intro"
        >
          <img src="/logo.svg" alt="" className="nav-brand-logo" />
          <span className="nav-brand-word">
            <span className="nav-brand-trace">Trace</span>
            <span className="nav-brand-xero">Xero</span>
          </span>
        </button>

        <ol className={`nav-dots${mobileNav ? " nav-dots-window" : ""}`}>
          {navIndices.map((i) => {
            const s = SLIDES[i];
            return (
              <li key={s.id}>
                <button
                  type="button"
                  className={`nav-dot${i === index ? " current" : ""}`}
                  onClick={() => goTo(i)}
                  aria-current={i === index ? "step" : undefined}
                  aria-label={`Slide ${i + 1}: ${s.label}`}
                >
                  <span className="nav-dot-index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="nav-dot-label">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="nav-arrows">
          <button
            type="button"
            className="nav-arrow"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <span className="nav-count">
            {index + 1} / {count}
          </span>
          <button
            type="button"
            className="nav-arrow"
            onClick={() => goTo(index + 1)}
            disabled={index === count - 1}
            aria-label="Next slide"
          >
            ›
          </button>
          <FullscreenButton />
        </div>
      </nav>

      <div className="presentation-stage">
        <div
          className="presentation-track"
          style={{
            width: `${count * 100}%`,
            transform: `translateX(-${index * (100 / count)}%)`,
          }}
        >
          <div className="presentation-slot" style={{ width: `${100 / count}%` }}>
            <IntroSlide onExplore={() => goTo(1)} />
          </div>
          <div className="presentation-slot" style={{ width: `${100 / count}%` }}>
            <DigitalTwinSlide />
          </div>
          <div className="presentation-slot" style={{ width: `${100 / count}%` }}>
            <ProductsSlide />
          </div>
          <div className="presentation-slot" style={{ width: `${100 / count}%` }}>
            <USPSlide />
          </div>
          <div className="presentation-slot" style={{ width: `${100 / count}%` }}>
            <ScaleupSlide />
          </div>
          <div className="presentation-slot" style={{ width: `${100 / count}%` }}>
            <PartnershipSlide />
          </div>
          <div className="presentation-slot" style={{ width: `${100 / count}%` }}>
            <OurTrialsSlide />
          </div>
          <div className="presentation-slot" style={{ width: `${100 / count}%` }}>
            <TeamSlide />
          </div>
        </div>
      </div>
    </div>
  );
}
