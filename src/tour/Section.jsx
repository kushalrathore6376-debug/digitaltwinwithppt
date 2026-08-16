import { useContext, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { layerFactor } from "../scene/reveal.js";
import { focusOf } from "./focus.js";
import { LayerContext } from "./LayerContext.js";

// What an out-of-focus surface is tinted toward. Close to the backdrop, so
// receding equipment sinks into the scene's depth rather than turning grey.
const RECEDE_TINT = new THREE.Color("#1b2028");

// Wraps one piece of equipment and ties it to a tour stage.
//
// Out of focus, equipment is *darkened*, not faded. Dropping opacity turned
// solid tanks into ghosts you could see straight through, which looked
// broken rather than de-emphasised — the plant is built, and it should look
// built from every stage. Tinting toward the background keeps every
// silhouette solid while still pushing it behind the current subject.
//
// Opacity is still owned here for the layer cross-fade, and deliberately so:
// the section and layer factors multiply, so switching view mid-tour looks
// right instead of one overwriting the other on alternate frames.
export function Section({ id, children }) {
  const groupRef = useRef();
  const layer = useContext(LayerContext);
  const materials = useRef([]);
  const wired = useRef(new WeakSet());

  const wireUp = () => {
    const group = groupRef.current;
    if (!group) return;
    materials.current = [];
    group.traverse((object) => {
      if (!object.isMesh || !object.material) return;
      const list = Array.isArray(object.material)
        ? object.material
        : [object.material];
      for (const material of list) {
        if (!wired.current.has(material)) {
          material.userData.baseOpacity ??= material.opacity;
          material.userData.baseTransparent ??= material.transparent;
          material.userData.baseDepthWrite ??= material.depthWrite;
          // remember the authored colour so the tint can be reversed exactly
          if (material.color)
            material.userData.baseColor ??= material.color.clone();
          // claim it, so the layer wrapper leaves its opacity alone
          material.userData.sectionOwned = true;
          wired.current.add(material);
        }
        // Some materials animate their own opacity every frame — smoke
        // puffs fading as they rise. Writing to those from here fights the
        // component that owns them and the result is whichever ran last,
        // which is why they read as solid blobs that pop instead of fading.
        if (!material.userData.selfAnimatedOpacity)
          materials.current.push(material);
      }
    });
  };

  // Mount-only: the children element changes identity on every simulation
  // tick, so re-traversing on it would mean walking the scene graph sixty
  // times a second to find materials that never change.
  useEffect(wireUp, []);

  const frame = useRef(0);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const focus = focusOf(id);
    const layerAmount = layerFactor(layer);

    // Only the layer cross-fade can take a section off screen entirely; the
    // tour never does. Out of focus means receded, not removed.
    const hidden = layerAmount <= 0.002;
    group.visible = !hidden;
    if (hidden) return;

    // catch anything that mounted late, but only while actually changing
    frame.current++;
    if ((focus < 0.998 || layerAmount < 0.998) && frame.current % 20 === 0)
      wireUp();

    for (const material of materials.current) {
      // opacity: layer cross-fade only
      const base = material.userData.baseOpacity ?? 1;
      material.opacity = base * layerAmount;
      material.transparent =
        material.userData.baseTransparent || layerAmount < 0.998;
      material.depthWrite =
        material.userData.baseDepthWrite && layerAmount > 0.5;

      // focus: colour only, so nothing ever turns see-through
      const baseColor = material.userData.baseColor;
      if (baseColor)
        material.color.copy(baseColor).lerp(RECEDE_TINT, 1 - focus);
    }
  });

  return <group ref={groupRef}>{children}</group>;
}
