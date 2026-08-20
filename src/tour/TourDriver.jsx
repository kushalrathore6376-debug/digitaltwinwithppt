import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useSimStore } from "../store.js";
import { STAGE_COUNT, stageAt } from "./stages.js";
import { explainStepAt } from "./explain.js";
import { stepFocus, setFocusEnabled } from "./focus.js";

// Advances the per-section focus every frame, and handles keyboard paging.
//
// The tour used to hijack the wheel to change stage. That took scrolling
// away from the camera, which is what a visitor reaches for first in a 3D
// scene — so the wheel now does the obvious thing and zooms, and stages are
// changed deliberately with Next/Back or the stage rail.
export function TourDriver() {
  const tourActive = useSimStore((s) => s.tourActive);
  const explainActive = useSimStore((s) => s.explainActive);

  useEffect(() => {
    setFocusEnabled(tourActive || explainActive);
  }, [tourActive, explainActive]);

  useEffect(() => {
    if (!tourActive) return;

    const onKey = (event) => {
      // Arrow and page keys only — they don't collide with the orbit
      // controls, which are pointer and wheel driven.
      const forward =
        event.key === "ArrowDown" ||
        event.key === "ArrowRight" ||
        event.key === "PageDown";
      const back =
        event.key === "ArrowUp" ||
        event.key === "ArrowLeft" ||
        event.key === "PageUp";
      if (!forward && !back) return;
      const { tourIndex, goToStage } = useSimStore.getState();
      goToStage(tourIndex + (forward ? 1 : -1), STAGE_COUNT);
      event.preventDefault();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tourActive]);

  // Drive the section focus. This runs whether or not anything is active:
  // with everything off, every section eases back to fully present.
  //
  // The explanation outranks the rail. It is a narrative that owns the camera
  // while it plays, and leaving the rail's stage in charge of what is lit
  // would show one thing and talk about another.
  useFrame((_, delta) => {
    const state = useSimStore.getState();
    const subject = state.explainActive
      ? explainStepAt(state.explainIndex).focus
      : stageAt(state.tourIndex).focus;
    stepFocus(subject, delta);
  });

  return null;
}
