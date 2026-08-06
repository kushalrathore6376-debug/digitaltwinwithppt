import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { easedReveal, stagger, layerFactor } from "./reveal.js";
import { LayerContext } from "../tour/LayerContext.js";

// Diagonal wipe direction. Points on the *keep* side satisfy
// normal · p + constant > 0, so sweeping the constant downward peels the
// shell away from the top-right corner of the plant toward the bottom-left.
const WIPE_NORMAL = new THREE.Vector3(-1, -0.55, 0).normalize();
const WIPE_START = 16; // fully closed — nothing clipped
const WIPE_END = -14; // fully open — nothing left

// Collect every material under a group once, remembering how it was
// authored. Materials a <Section> has claimed are skipped: the section owns
// their opacity, and two writers on the same value means the last one each
// frame wins at random.
function collectUnowned(group, wired, out) {
  out.length = 0;
  group.traverse((object) => {
    if (!object.isMesh || !object.material) return;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) {
      if (!wired.has(material)) {
        material.userData.baseOpacity ??= material.opacity;
        material.userData.baseTransparent ??= material.transparent;
        material.userData.baseDepthWrite ??= material.depthWrite;
        wired.add(material);
      }
      // skip section-owned materials, and any that animate their own
      // opacity (see the note in Section.jsx)
      if (!material.userData.sectionOwned && !material.userData.selfAnimatedOpacity)
        out.push(material);
    }
  });
}

// Wraps the exterior layer and animates it away when the view switches to
// cutaway. Two effects run together:
//
//   1. a clipping plane sweeps diagonally across the model, so the shell
//      peels open like a panel being drawn back rather than dissolving; and
//   2. whatever isn't inside a <Section> fades out on the tail of it.
//
// The clipping plane is assigned per-material (local clipping), not on the
// renderer, so the schematic layer underneath is never touched by it.
export function RevealGroup({ children }) {
  const groupRef = useRef();
  const gl = useThree((s) => s.gl);
  const planeRef = useRef(new THREE.Plane(WIPE_NORMAL.clone(), WIPE_START));
  const wired = useRef(new WeakSet());
  const clipped = useRef(new WeakSet());
  const unowned = useRef([]);

  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  // Attach the clipping plane to every material in the layer, and note
  // which ones still need fading from here.
  const wireUp = () => {
    const group = groupRef.current;
    if (!group) return;
    group.traverse((object) => {
      if (!object.isMesh || !object.material) return;
      const list = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of list) {
        if (clipped.current.has(material)) continue;
        material.clippingPlanes = [planeRef.current];
        material.clipShadows = true;
        material.needsUpdate = true;
        clipped.current.add(material);
      }
    });
    collectUnowned(group, wired.current, unowned.current);
  };

  // Child effects run before the parent's, so by the time this fires the
  // sections below have already claimed their materials.
  useEffect(wireUp, []);

  const frame = useRef(0);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const t = easedReveal();

    // Once fully cut away, stop rendering the layer entirely.
    const hidden = t >= 0.999;
    group.visible = !hidden;
    if (hidden) return;

    frame.current++;
    if (t > 0.001 && frame.current % 20 === 0) wireUp();

    // the wipe leads, so you see the shell open before it starts to fade
    const wipe = stagger(t, 0, 0.78);
    planeRef.current.constant = WIPE_START + (WIPE_END - WIPE_START) * wipe;

    const fade = layerFactor("exterior");
    for (const material of unowned.current) {
      const base = material.userData.baseOpacity ?? 1;
      material.opacity = base * fade;
      material.transparent = material.userData.baseTransparent || fade < 0.999;
      // never force depth writing on — see the note in Section.jsx
      material.depthWrite = material.userData.baseDepthWrite && fade > 0.5;
    }
  });

  return (
    <LayerContext.Provider value="exterior">
      <group ref={groupRef}>{children}</group>
    </LayerContext.Provider>
  );
}

// Mirror of RevealGroup for the schematic: it fades in on the tail of the
// sweep, and stops rendering while the exterior is closed.
export function CutawayGroup({ children }) {
  const groupRef = useRef();
  const wired = useRef(new WeakSet());
  const unowned = useRef([]);

  const wireUp = () => {
    const group = groupRef.current;
    if (group) collectUnowned(group, wired.current, unowned.current);
  };

  useEffect(wireUp, []);

  const frame = useRef(0);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const t = easedReveal();
    const visible = t > 0.001;
    group.visible = visible;
    if (!visible) return;

    frame.current++;
    if (t < 0.999 && frame.current % 20 === 0) wireUp();

    const fade = layerFactor("cutaway");
    for (const material of unowned.current) {
      const base = material.userData.baseOpacity ?? 1;
      material.opacity = base * fade;
      material.transparent = true;
    }
  });

  return (
    <LayerContext.Provider value="cutaway">
      <group ref={groupRef}>{children}</group>
    </LayerContext.Provider>
  );
}
