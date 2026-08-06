import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSimStore } from "../../store.js";
import { galvanised, stainless, paintedSteel } from "../../materials/industrial.js";

// Manual ball valve on an exterior pipe run.
//
// The exterior layer had no valves at all: every line ran uninterrupted from
// tank to tank, which is the one detail that gives away a model as a diagram
// rather than a plant. This is the same fitting the cutaway shows, in opaque
// industrial materials, and it swings on the same sim state — so a valve you
// watch open in the schematic is open in the exterior view too, and the
// toggle between them doesn't jump.
//
// `lever` is the local direction the handle stands out ("y" on a horizontal
// run, "x"/"z" on a vertical one) and `yaw` turns the fitting to sit on a
// run in Z rather than X.
export function LineValve({
  position,
  radius = 0.12,
  lever = "y",
  yaw = 0,
  openSelector,
}) {
  const handleRef = useRef();

  useFrame((_, delta) => {
    const handle = handleRef.current;
    if (!handle) return;
    const open = openSelector ? openSelector(useSimStore.getState()) : false;
    const target = open ? 0 : Math.PI / 2; // 0 = parallel to the pipe
    handle.rotation.y += (target - handle.rotation.y) * Math.min(1, delta * 5);
  });

  const leverRotation =
    lever === "x"
      ? [0, 0, -Math.PI / 2]
      : lever === "z"
        ? [Math.PI / 2, 0, 0]
        : [0, 0, 0];

  const body = galvanised("#79828c");
  const port = stainless("#c3ccd6");

  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh>
        <sphereGeometry args={[radius * 1.85, 18, 14]} />
        <meshStandardMaterial {...body} />
      </mesh>
      {/* the two flanged ports, so the body reads as fitted into the line
          rather than threaded onto it */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * radius * 1.9, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[radius * 1.5, radius * 1.5, radius * 0.5, 14]} />
          <meshStandardMaterial {...port} />
        </mesh>
      ))}
      <group rotation={leverRotation}>
        <group ref={handleRef} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[0, radius * 2.4, 0]}>
            <cylinderGeometry args={[radius * 0.32, radius * 0.4, radius * 1.5, 12]} />
            <meshStandardMaterial {...body} />
          </mesh>
          <mesh position={[radius * 1.2, radius * 3.1, 0]}>
            <boxGeometry args={[radius * 4, radius * 0.55, radius * 0.85]} />
            <meshStandardMaterial {...paintedSteel("#b8402f")} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
