import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Scene } from "../Scene.jsx";
import { useSimStore } from "../store.js";
import { ViewToggle } from "../ui/ViewToggle.jsx";
import { TourOverlay } from "../ui/TourOverlay.jsx";
import { ResetView } from "../ui/ResetView.jsx";
import { ControlPanel } from "../ui/ControlPanel.jsx";
import { PanelToggle } from "../ui/PanelToggle.jsx";
import { ExplainOverlay } from "../ui/ExplainOverlay.jsx";
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

// The carbon capture unit digital twin — the full standalone experience,
// embedded as the deck's second slide: the container/exterior/cutaway
// toggle, the stage rail, the instrumentation drawer and the guided
// explanation all work exactly as they do stand-alone. The one thing this
// wrapper adds on top is the WebGL-availability gate, which the standalone
// app doesn't need on its own dedicated page.
//
// The stage rail's own arrow-key stepping and the deck's slide-to-slide
// arrow keys both live on `window`, so Presentation.jsx defers to the twin
// (skips its own slide switch) whenever `tourActive` is on — see the guard
// there.
export function DigitalTwinSlide() {
  const compact = useIsCompact();
  const explainActive = useSimStore((s) => s.explainActive);
  const [webgl] = useState(hasWebGL);

  // Closed by default: the model is the point, and the instrumentation
  // drawer covers nearly half of it.
  const [panelOpen, setPanelOpen] = useState(false);

  // On a phone the drawer is a sheet along the bottom rather than a panel
  // over the model, and the canvas gives up the height rather than being
  // covered by it: two thirds model, one third instruments.
  const split = compact && panelOpen && !explainActive;

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
      <div className={`canvas-wrap${split ? " split" : ""}`}>
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
                "radial-gradient(ellipse 90% 75% at 55% 38%, #232c38 0%, #161a21 45%, #0d1015 100%)",
              width: "100%",
              height: "100%",
              display: "block",
            }}
            camera={{ position: [29, 18, 36], fov: 40 }}
            dpr={[1, compact ? 1.2 : 1.5]}
          >
            <Scene />
            <OrbitControls
              makeDefault
              enableDamping
              dampingFactor={0.06}
              minDistance={7}
              // the container and the wider stack put the far edge of the
              // model a good deal further out than the bare plant did
              maxDistance={compact ? 125 : 110}
              rotateSpeed={0.35}
              touches={{ ONE: 0, TWO: 2 }}
              zoomSpeed={compact ? 0.7 : 1}
              maxPolarAngle={Math.PI * 0.49}
              target={[3.6, 7, 2]}
            />
          </Canvas>
        </CanvasErrorBoundary>
        {!explainActive && <ViewToggle />}
        {!explainActive && (
          <PanelToggle
            open={panelOpen}
            onToggle={() => setPanelOpen((v) => !v)}
          />
        )}
        {!explainActive && <ResetView />}
        {!explainActive && <TourOverlay />}
        <ExplainOverlay />
        <ControlPanel open={panelOpen && !explainActive} compact={compact} />
      </div>
    </div>
  );
}
