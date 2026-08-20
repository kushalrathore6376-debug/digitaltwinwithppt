import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimStore } from "../store.js";
import { explainStepAt } from "../tour/explain.js";

// The line the explanation draws between two pieces of equipment.
//
// It follows the real route out of layout.js — the same points the pipe itself
// is built from — so it lies exactly on the pipework rather than beside it.
// That is the whole reason it convinces: it is not an arrow pointing at a
// diagram, it is the pipe lighting up.
//
// Drawn without depth testing, on purpose. This is annotation, and an
// annotation that disappears behind a tank has failed at the one moment it is
// needed — the step where the camera is deliberately wide enough to have
// equipment in the way.
//
// ---- on the look ----------------------------------------------------------
//
// The first version was a fat cyan tube with beads sliding along it and a cone
// on the end, and it looked like a diagram from 2009. Three things were wrong
// with it and all three are worth naming, because they are the usual ones:
//
//   Beads. Discrete objects travelling a line read as objects, and count
//   themselves — five balls in a row is five balls, never flow. Motion here is
//   a *gradient* scrolling along the line instead: nothing has an edge, so
//   there is nothing to count.
//
//   Saturated colour. A strong hue at strong opacity fights the model it is
//   annotating and reads as a highlighter pen. The line is near-white now, at
//   the same value as the specular on the vessels, with the accent kept for a
//   faint bloom around it.
//
//   Even weight. One tube at one thickness has no depth. It is two passes
//   now — a hairline core carrying the detail and a soft wide halo under it in
//   additive blend, which is what gives a glowing line its glow rather than
//   just its colour.
const CORE_COLOR = "#f2f8ff";
const GLOW_COLOR = "#7fd4ff";

// One dash of the travelling gradient: bright head trailing off to nothing
// behind it, repeated along the run. Soft at both ends — a dash with a hard
// edge is a dash you can count, which is the bead problem again in a thinner
// disguise.
function dashTexture() {
  const width = 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(width, 1);
  for (let x = 0; x < width; x++) {
    const t = x / width;
    // a comet: a short bright head, a long tail, and a gap before the next
    const head = Math.exp(-Math.pow((t - 0.62) / 0.1, 2));
    const tail = t < 0.62 ? Math.pow(t / 0.62, 2.4) * 0.55 : 0;
    const level = Math.min(1, head + tail);
    image.data[x * 4] = 255;
    image.data[x * 4 + 1] = 255;
    image.data[x * 4 + 2] = 255;
    image.data[x * 4 + 3] = Math.round(255 * level);
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// How long one dash is in world units. Set in world units rather than as a
// fixed repeat count so a short hop and a long run across the plant have the
// same rhythm — a repeat count would stretch the dashes on the long ones.
const DASH_LENGTH = 3.2;
const DASH_SPEED = 0.55; // dashes a second

function buildRoute(points) {
  const vectors = points.map((p) => new THREE.Vector3(...p));
  // centripetal, so a right-angle turn in the pipework does not overshoot into
  // a loop the way a uniform Catmull-Rom does
  const curve = new THREE.CatmullRomCurve3(vectors, false, "centripetal", 0.4);
  const length = curve.getLength();
  const segments = Math.max(48, Math.round(length * 6));
  return {
    curve,
    length,
    core: new THREE.TubeGeometry(curve, segments, 0.055, 8, false),
    glow: new THREE.TubeGeometry(curve, segments, 0.2, 8, false),
  };
}

export function ExplainArrow() {
  const active = useSimStore((s) => s.explainActive);
  const index = useSimStore((s) => s.explainIndex);
  const step = explainStepAt(index);
  const route = active ? step.arrow : null;

  const headRef = useRef();
  const clock = useRef(0);

  const built = useMemo(() => {
    if (!route) return null;
    const points = route();
    if (!points || points.length < 2) return null;
    const geometry = buildRoute(points);
    const tip = geometry.curve.getPointAt(1);
    const back = geometry.curve.getPointAt(0.98);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      tip.clone().sub(back).normalize()
    );
    return { ...geometry, tip, quaternion };
  }, [route]);

  const { coreMat, glowMat, headMat, maps } = useMemo(() => {
    const coreMap = dashTexture();
    const glowMap = dashTexture();
    const shared = {
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    };
    return {
      maps: { core: coreMap, glow: glowMap },
      coreMat: new THREE.MeshBasicMaterial({
        ...shared,
        color: CORE_COLOR,
        map: coreMap,
        opacity: 0,
      }),
      // Additive, and wide: this is the bloom the core sits inside. Additive
      // is what makes overlapping passes brighten rather than just stack, and
      // it is why the line reads as light instead of as a painted pipe.
      glowMat: new THREE.MeshBasicMaterial({
        ...shared,
        color: GLOW_COLOR,
        map: glowMap,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      }),
      headMat: new THREE.MeshBasicMaterial({
        ...shared,
        color: CORE_COLOR,
        opacity: 0,
      }),
    };
  }, []);

  // dash pitch follows the length of this particular run
  useEffect(() => {
    if (!built) return;
    const repeat = Math.max(1, Math.round(built.length / DASH_LENGTH));
    maps.core.repeat.set(repeat, 1);
    maps.glow.repeat.set(repeat, 1);
  }, [built, maps]);

  // every step starts its own fade-in
  useEffect(() => {
    clock.current = 0;
  }, [index, active]);

  useFrame((_, delta) => {
    if (!built) return;
    clock.current += delta;

    // Fade the whole thing up rather than snapping it on: the camera is still
    // flying when a step begins, and a line appearing mid-move reads as a
    // glitch in the render.
    const fade = Math.min(1, clock.current * 1.4);
    coreMat.opacity = 0.95 * fade;
    glowMat.opacity = 0.32 * fade;
    headMat.opacity = 0.9 * fade;

    // The one moving part. Negative, because the texture offset slides the
    // pattern against the surface — the dashes travel toward the destination.
    const travel = -clock.current * DASH_SPEED;
    maps.core.offset.x = travel;
    maps.glow.offset.x = travel * 0.92; // a touch of drag, so the glow trails

    if (headRef.current) {
      // a slow breath, not a throb
      const beat = 1 + Math.sin(clock.current * 2.2) * 0.07;
      headRef.current.scale.setScalar(beat * fade);
    }
  });

  if (!built) return null;

  return (
    <group renderOrder={40}>
      <mesh geometry={built.glow} material={glowMat} renderOrder={40} />
      <mesh geometry={built.core} material={coreMat} renderOrder={41} />
      {/* A slim head, and only at the destination. The old one was a fat cone
          that read as a traffic sign; this is closer to a cursor. */}
      <mesh
        ref={headRef}
        position={built.tip}
        quaternion={built.quaternion}
        material={headMat}
        renderOrder={42}
      >
        <coneGeometry args={[0.16, 0.62, 18]} />
      </mesh>
    </group>
  );
}
