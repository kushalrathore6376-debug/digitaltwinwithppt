import { useEffect, useRef, useState } from "react";
import { useSimStore } from "../store.js";
import { EXPLAIN_COUNT, explainStepAt } from "../tour/explain.js";

// The guided explanation, from the outside: a button that starts it, and a
// caption at the foot of the screen while it runs.
//
// The caption is at the bottom for the reason subtitles are: it is read
// without looking away from the thing it describes, and the bottom of the
// frame is the part of a 3D view with least in it. On a phone it sits above
// the control drawer rather than under it.
//
// Timing is done here, in the DOM, rather than in a useFrame in the scene.
// Advancing a step is a React state change either way, and a ten-times-a-
// second interval that only exists while the walkthrough is playing is a great
// deal cheaper than a callback in the render loop that is idle the rest of the
// time.
const TICK_MS = 100;

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path d={path} fill="currentColor" />
    </svg>
  );
}

const ICONS = {
  play: "M8 5v14l11-7z",
  pause: "M6 5h4v14H6zm8 0h4v14h-4z",
  prev: "M18 6v12l-8.5-6zM8 6h2v12H8z",
  next: "M6 6l8.5 6L6 18zm8 0h2v12h-2z",
  close: "M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7l1.4-1.4L10.6 10.6l6.3-6.3z",
  explain:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2zm1.8-7.2-.9.9c-.7.7-1.1 1.3-1.1 2.3h-2v-.5c0-1 .4-1.9 1.1-2.6l1.2-1.2c.4-.4.6-.9.5-1.5-.1-.7-.7-1.3-1.4-1.4A1.8 1.8 0 0 0 10.2 9h-2a3.8 3.8 0 1 1 6.6 2.8z",
};

export function ExplainOverlay() {
  const active = useSimStore((s) => s.explainActive);
  const index = useSimStore((s) => s.explainIndex);
  const paused = useSimStore((s) => s.explainPaused);
  const start = useSimStore((s) => s.startExplain);
  const stop = useSimStore((s) => s.stopExplain);
  const setPaused = useSimStore((s) => s.setExplainPaused);
  const goTo = useSimStore((s) => s.goToExplainStep);
  const setViewMode = useSimStore((s) => s.setViewMode);

  const step = explainStepAt(index);

  // The clock is stamped with the step it belongs to, so a step change resets
  // the progress bar by *derivation* rather than by writing state on the way
  // in — a stale reading and a fresh index can never be on screen together.
  const [clock, setClock] = useState({ index: 0, elapsed: 0 });
  const elapsedRef = useRef(0);
  const elapsed = clock.index === index ? clock.elapsed : 0;

  // Each step sets the view it needs — the stack is worth seeing as built,
  // and everything about the process is worth seeing through the shell.
  useEffect(() => {
    if (active && step.view) setViewMode(step.view);
  }, [active, index, step.view, setViewMode]);

  useEffect(() => {
    if (!active) return;
    // A pause must not rewind the step, so the clock only goes back to zero
    // when the step itself changes.
    elapsedRef.current = elapsed;
    if (paused) return;
    const id = setInterval(() => {
      elapsedRef.current += TICK_MS / 1000;
      setClock({ index, elapsed: elapsedRef.current });
      if (elapsedRef.current >= step.seconds) goTo(index + 1, EXPLAIN_COUNT);
    }, TICK_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, paused, index, step.seconds, goTo]);

  // Escape leaves, which is what everyone tries first
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === "Escape") stop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, stop]);

  if (!active) {
    return (
      <button
        type="button"
        className="explain-start"
        onClick={start}
        aria-label="Play the guided explanation"
      >
        <Icon path={ICONS.explain} />
        <span className="explain-start-label">Explain</span>
      </button>
    );
  }

  const progress = Math.min(1, elapsed / step.seconds) * 100;

  return (
    <div className="explain" role="region" aria-label="Guided explanation">
      <div className="explain-card">
        <div className="explain-progress" aria-hidden="true">
          <div className="explain-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <p className="explain-text">{step.text}</p>

        <div className="explain-controls">
          <span className="explain-count">
            {index + 1} / {EXPLAIN_COUNT}
          </span>
          <div className="explain-buttons">
            <button
              type="button"
              onClick={() => goTo(index - 1, EXPLAIN_COUNT)}
              disabled={index === 0}
              aria-label="Previous step"
            >
              <Icon path={ICONS.prev} />
            </button>
            <button
              type="button"
              onClick={() => setPaused(!paused)}
              aria-label={paused ? "Resume" : "Pause"}
            >
              <Icon path={paused ? ICONS.play : ICONS.pause} />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1, EXPLAIN_COUNT)}
              aria-label="Next step"
            >
              <Icon path={ICONS.next} />
            </button>
            <button type="button" onClick={stop} aria-label="End the explanation">
              <Icon path={ICONS.close} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
