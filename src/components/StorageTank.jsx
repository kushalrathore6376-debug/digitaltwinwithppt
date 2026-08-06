import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSimStore } from "../store.js";
import { GlassShell } from "./Vessel.jsx";

// Plain buffer tank under the absorption chambers. Their drains feed it; a
// low transfer line moves its contents on to the decomposition chamber.
// Capacity is a little more than both chambers combined.
export function StorageTank({
  position = [0, 0, 0],
  height,
  radius,
  // Which level this vessel shows, and what colour its contents are. The
  // filtration chamber is the same kind of tank reading a different value,
  // so it reuses this rather than being a near-copy of it.
  fillSelector = (s) => s.storageFill,
  liquidColor = "#4a6d8c",
  errorKeyword = "Storage",
}) {
  const liquidRef = useRef();
  // Housing flashes red while a matching error is on screen
  const hasError = useSimStore(
    (s) => s.error?.includes(errorKeyword) ?? false
  );

  useFrame(() => {
    const liquid = liquidRef.current;
    if (!liquid) return;
    const fill = fillSelector(useSimStore.getState());
    const level = Math.max(0.001, fill);
    liquid.scale.y = level;
    liquid.position.y = (height * 0.9 * level) / 2 + 0.05;
    liquid.visible = fill > 0.005;
  });

  return (
    <group position={position}>
      <group position={[0, height / 2, 0]}>
        <GlassShell
          height={height}
          radius={radius}
          tint={hasError ? "#e08d8d" : undefined}
        />
      </group>
      <mesh ref={liquidRef} visible={false}>
        <cylinderGeometry args={[radius * 0.92, radius * 0.92, height * 0.9, 48]} />
        {/* unlit so the color stays constant from every viewing angle */}
        <meshBasicMaterial
          color={liquidColor}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
