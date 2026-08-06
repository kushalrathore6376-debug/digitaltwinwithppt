import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSimStore } from "../store.js";
import { reveal, REVEAL_SECONDS } from "./reveal.js";

// Advances the process simulation. One place owns the clock.
function SimulationClock() {
  const tick = useSimStore((s) => s.tick);
  useFrame((_, delta) => tick(delta));
  return null;
}

// Drives the shared reveal value toward whichever view is selected. Runs
// every frame but never touches React state, so the toggle costs one
// re-render, not sixty a second.
function RevealDriver() {
  const viewMode = useSimStore((s) => s.viewMode);
  const setRevealPhase = useSimStore((s) => s.setRevealPhase);

  // Writing the target during render was a side effect in the render phase.
  // It happened to work, but it is the kind of thing that breaks the moment
  // React renders twice or out of order.
  useEffect(() => {
    reveal.target = viewMode === "cutaway" ? 1 : 0;
  }, [viewMode]);

  useFrame((_, delta) => {
    const step = delta / REVEAL_SECONDS;
    const diff = reveal.target - reveal.value;
    if (Math.abs(diff) <= step) reveal.value = reveal.target;
    else reveal.value += Math.sign(diff) * step;

    // Publish only when it actually settles or starts moving — the setter
    // ignores no-op writes, so this costs nothing on the frames between.
    setRevealPhase(
      reveal.value === 0 ? "exterior" : reveal.value === 1 ? "cutaway" : "moving"
    );
  });
  return null;
}

// Three lights, no shadow maps, no environment probe.
//
// The earlier rig rendered a cube-map environment and a 1k shadow map every
// frame to sell photoreal metal. This is a stylised look instead: a strong
// key for the form, a cool fill so the shadow side never goes black, and a
// warm low rim that separates every silhouette from the background. That
// rim is doing most of the work — it is what makes the shapes read as
// designed objects rather than grey solids.
function LightingRig() {
  return (
    <>
      <ambientLight intensity={0.85} />
      <hemisphereLight args={["#b9d6f2", "#2b2a33", 1.1]} />
      <directionalLight position={[9, 15, 8]} intensity={1.9} color="#ffffff" />
      <directionalLight position={[-11, 5, -6]} intensity={0.75} color="#7fa8d8" />
      <directionalLight position={[-5, 1.5, 10]} intensity={0.65} color="#ffb98a" />
    </>
  );
}

// Keeps the plant in frame at any window shape.
//
// A perspective camera's `fov` is the *vertical* angle, so on a tall narrow
// viewport — a phone in portrait — a fov tuned for a desktop gives almost
// no horizontal coverage and the plant simply falls off both sides. The fix
// is to hold the horizontal angle constant instead and let the vertical one
// follow the aspect ratio, which is what a real lens choice does.
const BASE_FOV = 40; // vertical fov that suits a wide desktop window
const REFERENCE_ASPECT = 1.6;
const MAX_FOV = 78; // beyond this the perspective distortion gets ugly

function AdaptiveFraming() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    if (aspect >= REFERENCE_ASPECT) {
      camera.fov = BASE_FOV;
    } else {
      const toRad = Math.PI / 180;
      // the horizontal angle the desktop framing gives us...
      const halfH = Math.tan((BASE_FOV * toRad) / 2) * REFERENCE_ASPECT;
      // ...held constant while the vertical angle opens up to match
      const fov = (2 * Math.atan(halfH / aspect)) / toRad;
      camera.fov = Math.min(MAX_FOV, fov);
    }
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}

// Renderer settings applied once on mount.
function RendererSetup() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  // Configuring the renderer is a side effect, so it belongs in an effect
  // rather than in the render body.
  useEffect(() => {
    // Gentle tone curve rather than full ACES: with a flat palette, ACES
    // was desaturating the accent colours the whole look leans on.
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.0;
    // Fog does the depth cueing that ambient occlusion used to, for free.
    scene.fog = new THREE.Fog("#12151b", 26, 72);
  }, [gl, scene]);

  return null;
}

// Dev-only handle on the renderer state, the counterpart to `window.__sim`.
// Worth keeping: the tanks-invisible-in-cutaway bug looked like a material
// problem from the outside and was only pinned down by walking the live
// scene graph from the console. Stripped from production builds.
function DevHandle() {
  const state = useThree();
  useEffect(() => {
    if (import.meta.env.DEV) window.__three = state;
  }, [state]);
  return null;
}

// Everything both views share: the clock, the reveal driver, lighting and
// renderer setup.
export function SceneCore() {
  return (
    <>
      <RendererSetup />
      <DevHandle />
      <AdaptiveFraming />
      <SimulationClock />
      <RevealDriver />
      <LightingRig />
    </>
  );
}
