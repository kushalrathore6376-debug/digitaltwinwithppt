import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSimStore, flowScale } from "../store.js";
import { makeRandom } from "./rng.js";

const LIFETIME = 4.2;

// Flue plume. Each puff rises, drifts downwind, expands and thins out —
// the classic billboard-free approach, which holds up from any orbit angle
// because the puffs are actual spheres in space rather than camera-facing
// cards.
//
// The plume thickens with the gas flow setting, so the stack visibly reacts
// to the control panel even in the exterior view where no pipework shows.
export function Smoke({ position, count = 22 }) {
  const groupRef = useRef();
  const [cx, cy, cz] = position;
  const random = useMemo(() => makeRandom(7), []);

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        // stagger the initial ages so the plume is already established on
        // the first frame instead of erupting all at once
        age: (i / count) * LIFETIME,
        driftX: 0.1 + random() * 0.3,
        driftZ: (random() - 0.5) * 0.28,
        wobble: random() * Math.PI * 2,
        speed: 0.55 + random() * 0.45,
        spin: (random() - 0.5) * 0.6,
        size: 0.8 + random() * 0.5,
      })),
    [count, random]
  );

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const density = flowScale(useSimStore.getState().gasFlow);

    group.children.forEach((puff, i) => {
      const seed = seeds[i];
      seed.age += delta;
      if (seed.age > LIFETIME) {
        seed.age -= LIFETIME;
        seed.driftX = 0.1 + random() * 0.3;
        seed.driftZ = (random() - 0.5) * 0.28;
        seed.wobble = random() * Math.PI * 2;
      }
      const t = seed.age;
      // the plume slows and bends over as it rises
      const rise = seed.speed * t * (1 - t / (LIFETIME * 2.6));
      const spread = Math.sin(seed.wobble + t * 0.9) * 0.16 * t;
      puff.position.set(
        cx + seed.driftX * t * 1.25 + spread,
        cy + rise * 1.5,
        cz + seed.driftZ * t + spread * 0.6
      );
      puff.rotation.y += seed.spin * delta;
      puff.scale.setScalar(seed.size * (0.42 + t * 0.62));
      // fade in over the first moment so puffs don't pop at the flue lip,
      // then thin out over the rest of the life
      const fadeIn = Math.min(1, t * 4);
      const fadeOut = 1 - t / LIFETIME;
      puff.material.opacity = 0.3 * fadeIn * fadeOut * fadeOut * density;
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} renderOrder={3}>
          {/* low-poly and irregular: a smooth sphere reads as a balloon */}
          <icosahedronGeometry args={[0.3, 1]} />
          <meshStandardMaterial
            color="#cdd4da"
            roughness={1}
            metalness={0}
            transparent
            opacity={0.2}
            depthWrite={false}
            flatShading
            // this component fades each puff itself every frame; the flag
            // stops the section/layer wrappers overwriting that
            userData={{ selfAnimatedOpacity: true }}
          />
        </mesh>
      ))}
    </group>
  );
}
