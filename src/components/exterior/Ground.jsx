import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { concrete } from "../../materials/industrial.js";
import { PAD_CENTER, PAD_RADIUS } from "../../layout.js";
import { easedReveal } from "../../scene/reveal.js";

// Concrete apron the plant stands on. Shared by both views — the schematic
// still needs something under it, it just dims down so the diagram reads.
export function Ground() {
  const padRef = useRef();

  useFrame(() => {
    const pad = padRef.current;
    if (!pad) return;
    // pull the pad back in the cutaway view so it never competes with the
    // process colours, but keep it there so the model isn't floating
    const t = easedReveal();
    const faded = t > 0.01;
    pad.material.opacity = 1 - t * 0.88;
    pad.material.transparent = faded;
    // A transparent slab that still writes depth was hiding every tank
    // standing on it. Going transparent moves the pad into the sorted pass,
    // where a twenty-six-metre disc gets drawn somewhere in the middle of
    // the queue and stamps the depth buffer across the whole floor — after
    // which the tanks behind that plane are rejected outright, and the
    // cutaway shows a ring of rims with nothing inside them. It reads as
    // "the tanks are invisible"; it is really "the ground is in front of
    // them". A pad you can see through must not write depth.
    pad.material.depthWrite = !faded;
  });

  return (
    <group position={PAD_CENTER}>
      {/* main slab, very slightly below zero so nothing z-fights with it */}
      {/* renderOrder -1: once it is transparent it belongs at the back of
          the sorted pass, under everything standing on it */}
      <mesh
        ref={padRef}
        renderOrder={-1}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
      >
        <circleGeometry args={[PAD_RADIUS, 96]} />
        <meshStandardMaterial {...concrete("#6f7274")} />
      </mesh>

    </group>
  );
}
