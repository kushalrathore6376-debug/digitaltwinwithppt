import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSimStore } from "../store.js";
import { useMachineIdle } from "./useMachineIdle.js";
import { GlassShell } from "./Vessel.jsx";

export function BaseUnit({ position = [0, 0, 0], height, radius }) {
  // Housing flashes red while a "decomposition chamber full" error is shown
  const hasError = useSimStore(
    (s) => s.error?.includes("Decomposition") ?? false,
  );
  const motorHeight = 0.8;
  const motorY = height + motorHeight / 2; // sits flush on top of the housing
  const fanY = 0.35; // fan hub sits just above the housing floor
  const fanRef = useRef();
  const liquidRef = useRef();
  const motorRef = useRef();

  // same tremble as the exterior motor, so the two views agree
  useMachineIdle(motorRef, (s) => s.autoRun && s.decompFill > 0);

  // Fan stirs the decomposition chamber, so it only spins while there is
  // something in it (and the process is running). Liquid height tracks the
  // live decomposition fill level.
  useFrame((_, delta) => {
    const { autoRun, decompFill } = useSimStore.getState();
    if (fanRef.current && autoRun && decompFill > 0) {
      fanRef.current.rotation.y += delta * 6;
    }
    const liquid = liquidRef.current;
    if (liquid) {
      const level = Math.max(0.001, decompFill);
      liquid.scale.y = level;
      liquid.position.y = (height * 0.9 * level) / 2 + 0.05;
      liquid.visible = decompFill > 0.005;
    }
  });

  return (
    <group position={position}>
      {/* housing: grounded, bottom at y=0, top at y=height */}
      <group position={[0, height / 2, 0]}>
        <GlassShell
          height={height}
          radius={radius}
          tint={hasError ? "#e08d8d" : undefined}
        />
      </group>

      {/* decomposition liquid dumped in from the chamber drains */}
      <mesh ref={liquidRef} visible={false}>
        <cylinderGeometry
          args={[radius * 0.92, radius * 0.92, height * 0.9, 48]}
        />
        {/* unlit so the color stays constant from every viewing angle */}
        <meshBasicMaterial
          color="#12e4e4"
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* electric motor standing on the housing, drive face down: finned
          body, rounded end bell below with a dark grille, cap on top, and a
          terminal box on the side */}
      <group position={[0, motorY, 0]} ref={motorRef}>
        <mesh>
          <cylinderGeometry args={[0.36, 0.36, motorHeight * 0.8, 28]} />
          <meshStandardMaterial
            color="#4f63e6"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
        {/* cooling fins around the body */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI * 2) / 12;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.38, 0, Math.sin(a) * 0.38]}
              rotation={[0, -a, 0]}
            >
              <boxGeometry args={[0.05, motorHeight * 0.75, 0.09]} />
              <meshStandardMaterial
                color="#3f52c9"
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>
          );
        })}
        {/* rounded end bell facing down toward the housing, with grille */}
        <mesh position={[0, -motorHeight * 0.52, 0]}>
          <cylinderGeometry args={[0.42, 0.3, motorHeight * 0.35, 28]} />
          <meshStandardMaterial
            color="#4f63e6"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[0, -motorHeight * 0.7, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.05, 24]} />
          <meshStandardMaterial color="#22262e" roughness={0.9} />
        </mesh>
        {/* top cap */}
        <mesh position={[0, motorHeight * 0.47, 0]}>
          <cylinderGeometry args={[0.28, 0.36, motorHeight * 0.18, 28]} />
          <meshStandardMaterial
            color="#4356cf"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
        {/* terminal box on the side */}
        <mesh position={[0.45, 0.08, 0]}>
          <boxGeometry args={[0.26, 0.28, 0.3]} />
          <meshStandardMaterial
            color="#39406e"
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>
      </group>

      {/* drive shaft: runs from the motor down through the housing to the fan */}
      <mesh position={[0, (height + fanY) / 2, 0]}>
        <cylinderGeometry args={[0.06, 0.06, height - fanY, 16]} />
        <meshStandardMaterial color="#847474" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* fan: hub + crossed blades near the housing floor, spun by the shaft */}
      <group ref={fanRef} position={[0, fanY, 0]}>
        <mesh>
          <cylinderGeometry args={[0.14, 0.14, 0.18, 16]} />
          <meshStandardMaterial
            color="#847474"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
        <mesh>
          <boxGeometry args={[radius * 1.7, 0.08, 0.22]} />
          <meshStandardMaterial
            color="#b8bec7"
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[radius * 1.7, 0.08, 0.22]} />
          <meshStandardMaterial
            color="#b8bec7"
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}
