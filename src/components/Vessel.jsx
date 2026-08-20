import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export const VESSEL_HEIGHT = 4;
export const VESSEL_RADIUS = 1.2;

// The cutaway view's one material: a pale, barely-there wall you read the
// contents through.
export const GLASS_TINT = "#aec4d6";

// Every vessel in the schematic is the same piece of glass.
//
// The grade-level tanks used to be a dark grey shell at half opacity, which
// against a dark backdrop meant they were simply not there — you saw a label
// and a stirrer floating over nothing. A shell only reads as a shell if it
// has an edge, so this pairs the wall with bright rings at both ends: the
// rings draw the silhouette, the wall fills it, and the level inside stays
// legible.
export function GlassShell({ height, radius, tint = GLASS_TINT, opacity = 0.16 }) {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[radius, radius, height, 64, 1, true]} />
        <meshStandardMaterial
          color={tint}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[0, (side * height) / 2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={1}
        >
          <torusGeometry args={[radius, 0.03, 8, 64]} />
          {/* unlit: the outline has to hold up from every angle, including
              the ones where a lit ring would turn its far side black */}
          <meshBasicMaterial
            color={tint}
            transparent
            opacity={0.9}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function Vessel({
  position = [0, 0, 0],
  fillLevel = 0,
  color = "#19ae57",
  height = VESSEL_HEIGHT,
  radius = VESSEL_RADIUS,
}) {
  const liquidRef = useRef();

  useFrame((_, delta) => {
    const liquid = liquidRef.current;
    if (!liquid) return;

    const target = Math.max(0.001, fillLevel);
    liquid.scale.y += (target - liquid.scale.y) * Math.min(1, delta * 4);
    liquid.position.y = -(height / 2) + (height * liquid.scale.y) / 2;
  });

  return (
    <group position={position}>
      <GlassShell height={height} radius={radius} />
      <mesh ref={liquidRef} scale={[1, fillLevel, 1]}>
        <cylinderGeometry
          args={[radius * 0.95, radius * 0.95, height, 64, 1, false]}
        />
        {/* Unlit on purpose: a lit material's apparent saturation shifts
            with view angle (specular highlights, double-sided overdraw from
            below vs. a single face from above). Basic material keeps the
            liquid color constant from every angle. */}
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
