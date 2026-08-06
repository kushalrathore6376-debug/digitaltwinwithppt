import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Scene } from "../Scene.jsx";
import { useSimStore } from "../store.js";
import { ViewToggle } from "../ui/ViewToggle.jsx";
import { OverviewCaption } from "../ui/OverviewCaption.jsx";
import { CanvasErrorBoundary } from "../ui/CanvasErrorBoundary.jsx";
import { hasWebGL } from "../ui/hasWebGL.js";

// Phones do the same work as a desktop on a fraction of the power budget,
// and at 3x device pixel ratio they are shading nine times the fragments.
// Capping the ratio is by far the cheapest win available; a 1.2x cap on a
// small screen is visually indistinguishable and roughly doubles the frame
// rate.
function useIsCompact() {
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 900
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 899px)");
    const update = (e) => setCompact(e.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return compact;
}

// A handful of real environments — hardware acceleration turned off,
// virtualised sessions without GPU passthrough, a blocklisted driver —
// can't create a WebGL context at all. Checked once, up front, rather than
// mounting <Canvas> and hoping: react-three-fiber's own failure in that
// case doesn't reliably surface as a catchable error.
function Fallback() {
  return (
    <div className="twin-fallback">
      <img src="/products/tx1-prototype.jpeg" alt="The TX-1 direct air capture unit" />
      <h2>3D view unavailable in this browser</h2>
      <p>
        This browser or device can't create a WebGL context, so the
        interactive model can't render here. It works normally in a
        standard browser with hardware acceleration on — Safari on iPad,
        or Chrome/Edge outside a restricted or virtualised session.
      </p>
    </div>
  );
}

// The carbon capture unit digital twin — display-only stop on the deck.
// The deck already walks a visitor through the story slide by slide, so
// this stop shows a single framing (the model's overview shot) rather than
// its own guided walkthrough: exterior/cutaway toggle and free orbit still
// work exactly as before, just without the stage stepper or its keyboard
// shortcuts, which would otherwise fight the slide-to-slide arrow keys.
export function DigitalTwinSlide() {
  const compact = useIsCompact();
  const setViewMode = useSimStore((s) => s.setViewMode);
  const setTourActive = useSimStore((s) => s.setTourActive);
  const requestRecenter = useSimStore((s) => s.requestRecenter);
  const [webgl] = useState(hasWebGL);

  useEffect(() => {
    setTourActive(false);
  }, [setTourActive]);

  if (!webgl) {
    return (
      <div className="app-layout">
        <div className="canvas-wrap">
          <Fallback />
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div className="canvas-wrap">
        <CanvasErrorBoundary>
          <Canvas
            gl={{
              antialias: true,
              powerPreference: "high-performance",
              toneMapping: THREE.NeutralToneMapping,
              failIfMajorPerformanceCaveat: false,
            }}
            style={{
              background:
                "radial-gradient(ellipse 90% 75% at 55% 38%, #232c38 0%, #171b22 45%, #0e1116 100%)",
              width: "100%",
              height: "100%",
              display: "block",
            }}
            camera={{ position: [19, 12, 25], fov: 40 }}
            dpr={[1, compact ? 1.2 : 1.5]}
          >
            <Scene />
            <OrbitControls
              makeDefault
              enableDamping
              dampingFactor={0.06}
              minDistance={7}
              maxDistance={compact ? 46 : 38}
              rotateSpeed={0.35}
              touches={{ ONE: 0, TWO: 2 }}
              zoomSpeed={compact ? 0.7 : 1}
              maxPolarAngle={Math.PI * 0.49}
              target={[-1.2, 5.2, 0]}
            />
          </Canvas>
        </CanvasErrorBoundary>
        <ViewToggle />
        <button
          type="button"
          className="reset-view"
          onClick={() => {
            setViewMode("exterior");
            requestRecenter();
          }}
          title="Back to the overview"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path
              d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"
              fill="currentColor"
            />
          </svg>
          Reset view
        </button>
        <OverviewCaption />
      </div>
    </div>
  );
}
