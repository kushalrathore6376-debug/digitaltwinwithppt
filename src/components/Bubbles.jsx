import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSimStore, flowScale, isGasFlowing } from "../store.js";
import { makeRandom } from "./rng.js";
import {
  LIFT,
  SPARGER_Y,
  COLUMN_POSITION,
  COLUMN_FLOOR_Y,
  WATER_HEIGHT,
} from "../layout.js";
import { VESSEL_HEIGHT } from "./Vessel.jsx";

// Gas bubbles rising from the open spoke tips of a chamber's sparger. Only
// the chamber currently receiving gas bubbles, and bubbles pop at the liquid
// surface (which tracks the live fill level).
const SPOKE_COUNT = 8;
const SPOKE_TIP_DIST = 0.82; // matches the sparger spoke length

function spokeTip(random, radiusJitter = 0.05) {
  const angle = (Math.floor(random() * SPOKE_COUNT) * Math.PI * 2) / SPOKE_COUNT;
  const jitter = () => (random() * 2 - 1) * radiusJitter;
  return {
    x: Math.cos(angle) * SPOKE_TIP_DIST + jitter(),
    z: Math.sin(angle) * SPOKE_TIP_DIST + jitter(),
  };
}

export function Bubbles({ vesselLocal, chamberId, count = 16 }) {
  const groupRef = useRef();
  const floorY = LIFT - VESSEL_HEIGHT / 2;
  // each chamber gets its own stream, so A and B never bubble in lockstep
  const random = useMemo(() => makeRandom(chamberId === "A" ? 11 : 29), [chamberId]);

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        ...spokeTip(random),
        speed: 0.7 + random() * 0.9,
        y: SPARGER_Y + random() * (VESSEL_HEIGHT * 0.6),
      })),
    [count, random]
  );

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const state = useSimStore.getState();
    const chamber = state.chambers[chamberId];
    const show =
      state.autoRun &&
      state.activeChamber === chamberId &&
      chamber.phase === "active";
    group.visible = show;
    if (!show) return;

    const surfaceY = floorY + chamber.fill * VESSEL_HEIGHT;
    group.children.forEach((bubble, i) => {
      const seed = seeds[i];
      seed.y += seed.speed * flowScale(state.gasFlow) * delta;
      if (seed.y >= surfaceY - 0.08) {
        seed.y = SPARGER_Y + 0.05;
        Object.assign(seed, spokeTip(random));
      }
      bubble.position.set(
        vesselLocal[0] + seed.x,
        Math.min(seed.y, surfaceY),
        vesselLocal[2] + seed.z
      );
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} renderOrder={3}>
          <sphereGeometry args={[0.025 + (i % 3) * 0.008, 10, 10]} />
          <meshStandardMaterial
            color="#dfeef7"
            transparent
            opacity={0.65}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// Small bubbles rising in the water column from the supply dip tube's open
// end, whenever gas is flowing through the system.
const W_FLOOR_Y = COLUMN_FLOOR_Y;
const DIP_X = COLUMN_POSITION[0] + 0.4; // matches the supply route's dip tube
const DIP_END_Y = W_FLOOR_Y + 0.3;

export function ColumnBubbles({ count = 10 }) {
  const groupRef = useRef();
  const random = useMemo(() => makeRandom(53), []);

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (random() * 2 - 1) * 0.18,
        z: (random() * 2 - 1) * 0.18,
        speed: 0.5 + random() * 0.6,
        y: DIP_END_Y + random() * WATER_HEIGHT * 0.5,
      })),
    [count, random]
  );

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const state = useSimStore.getState();
    const water = state.chambers.W;
    const show = isGasFlowing(state) && water.fill > 0.1;
    group.visible = show;
    if (!show) return;

    const surfaceY = W_FLOOR_Y + water.fill * WATER_HEIGHT;
    group.children.forEach((bubble, i) => {
      const seed = seeds[i];
      seed.y += seed.speed * flowScale(state.gasFlow) * delta;
      if (seed.y >= surfaceY - 0.06) {
        seed.y = DIP_END_Y;
        seed.x = (random() * 2 - 1) * 0.18;
        seed.z = (random() * 2 - 1) * 0.18;
      }
      bubble.position.set(
        DIP_X + seed.x,
        Math.min(seed.y, surfaceY),
        COLUMN_POSITION[2] + seed.z
      );
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} renderOrder={3}>
          <sphereGeometry args={[0.02 + (i % 3) * 0.007, 8, 8]} />
          <meshStandardMaterial
            color="#dfeef7"
            transparent
            opacity={0.65}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
