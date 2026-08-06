import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimStore, flowScale } from "../store.js";

// Draws a cylinder between two arbitrary world-space points. Nothing here
// is hand-placed: length, midpoint, and rotation are all derived from
// `start`/`end`, so a pipe stays correct if either endpoint moves.
export function Pipe({
  start,
  end,
  radius = 0.12,
  color = "#d6e2ee",
  // Opaque enough to read through a vessel wall. At 0.3 the pipework
  // inside a chamber disappeared into the glass, which is the one thing
  // the cutaway view exists to show.
  opacity = 0.55,
}) {
  const { position, quaternion, length } = useMemo(() => {
    const startV = new THREE.Vector3(...start);
    const endV = new THREE.Vector3(...end);
    const direction = new THREE.Vector3().subVectors(endV, startV);
    const len = direction.length();
    const mid = new THREE.Vector3()
      .addVectors(startV, endV)
      .multiplyScalar(0.5);

    // Cylinders are authored pointing up the local Y axis by default,
    // so rotate that axis onto the actual start->end direction.
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );

    return { position: mid, quaternion: quat, length: len };
  }, [start, end]);

  return (
    // renderOrder 2: draw after the vessel liquid/walls so pipes running
    // inside a tank stay visible through the transparent material
    <mesh position={position} quaternion={quaternion} renderOrder={2}>
      <cylinderGeometry args={[radius, radius, length, 16, 1, true]} />
      <meshStandardMaterial
        color={color}
        metalness={0.3}
        roughness={0.2}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// Liquid slugs travelling along the polyline so the flow direction is
// visible through the transparent pipe wall. Slugs are spaced evenly and
// loop from the first point to the last. `selector` decides visibility from
// sim state (defaults to "process running").
export function FlowDots({
  points,
  radius,
  color,
  count = 7,
  speed = 1.2,
  selector = (s) => s.autoRun,
}) {
  const groupRef = useRef();

  const { vectors, segmentLengths, totalLength } = useMemo(() => {
    const vecs = points.map((p) => new THREE.Vector3(...p));
    const lens = vecs.slice(0, -1).map((v, i) => v.distanceTo(vecs[i + 1]));
    return {
      vectors: vecs,
      segmentLengths: lens,
      totalLength: lens.reduce((a, b) => a + b, 0),
    };
  }, [points]);

  const travelRef = useRef(0);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const state = useSimStore.getState();
    const running = selector(state);
    group.visible = running;
    if (!running) return;
    // gas flow setting scales the travel speed; accumulate distance so
    // changing the flow mid-run doesn't make the dots jump
    travelRef.current =
      (travelRef.current + speed * flowScale(state.gasFlow) * delta) % totalLength;
    const t = travelRef.current;
    group.children.forEach((dot, i) => {
      // distance travelled along the whole run, per dot, evenly staggered
      let d = (t + (i / count) * totalLength) % totalLength;
      for (let s = 0; s < segmentLengths.length; s++) {
        if (d <= segmentLengths[s]) {
          dot.position.lerpVectors(
            vectors[s],
            vectors[s + 1],
            d / segmentLengths[s]
          );
          break;
        }
        d -= segmentLengths[s];
      }
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[radius * 0.45, 12, 12]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

// Ring sparger at the bottom of a chamber: central hub that the drop pipe
// plugs into, radial spoke pipes, and a distribution ring. Gas flows in
// through the hub, out along the spokes/ring, and bubbles up into the liquid.
export function Sparger({ position, radius = 0.85 }) {
  const pipeRadius = 0.06;
  const spokes = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
  const metal = { color: "#6b7280", metalness: 0.6, roughness: 0.35 };
  return (
    <group position={position}>
      {/* hub the drop pipe connects into */}
      <mesh renderOrder={1}>
        <cylinderGeometry args={[pipeRadius * 2.4, pipeRadius * 2.4, pipeRadius * 4, 20]} />
        <meshStandardMaterial color="#7d8694" metalness={0.6} roughness={0.3} />
      </mesh>
      {spokes.map((angle) => (
        <mesh
          key={angle}
          position={[
            (Math.cos(angle) * radius) / 2,
            0,
            (Math.sin(angle) * radius) / 2,
          ]}
          rotation={[0, -angle, Math.PI / 2]}
          renderOrder={1}
        >
          {/* open-ended so the hollow pipe mouth is visible at the tip —
              this is where the gas bubbles escape */}
          <cylinderGeometry args={[pipeRadius, pipeRadius, radius, 10, 1, true]} />
          <meshStandardMaterial {...metal} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={1}>
        <torusGeometry args={[radius * 0.75, pipeRadius, 10, 48]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      {/* solid infill plate between the spokes, flush under the wheel */}
      <mesh position={[0, -pipeRadius * 0.6, 0]} renderOrder={1}>
        <cylinderGeometry args={[radius * 0.75, radius * 0.75, pipeRadius, 48]} />
        <meshStandardMaterial color="#787f8a" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

// Ball valve fitting sitting on a pipe: solid body sphere plus a red lever
// handle. `lever` is the local direction the handle sticks out ("y" for a
// valve on a horizontal run, "x"/"z" for one on a vertical run).
// `openSelector` reads sim state: while it returns true the lever swings
// parallel to the pipe (open); otherwise it rests perpendicular (closed).
// `yaw` turns the whole fitting about Y — a valve on a run in Z needs a
// quarter turn, or "parallel to the pipe" points across it instead of along.
export function Valve({
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
    const target = open ? 0 : Math.PI / 2; // 0 = parallel to pipe
    handle.rotation.y += (target - handle.rotation.y) * Math.min(1, delta * 5);
  });

  const leverRotation =
    lever === "x" ? [0, 0, -Math.PI / 2] : lever === "z" ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh>
        <sphereGeometry args={[radius * 1.9, 20, 20]} />
        <meshStandardMaterial color="#6b7280" metalness={0.7} roughness={0.3} />
      </mesh>
      <group rotation={leverRotation}>
        <group ref={handleRef} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[0, radius * 2.6, 0]}>
            <cylinderGeometry args={[radius * 0.3, radius * 0.3, radius * 1.6, 12]} />
            <meshStandardMaterial color="#6b7280" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[radius * 1.2, radius * 3.2, 0]}>
            <boxGeometry args={[radius * 4, radius * 0.6, radius * 0.9]} />
            <meshStandardMaterial color="#c0392b" metalness={0.4} roughness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// Orthogonal pipe run through an ordered list of waypoints: a straight Pipe
// per segment, with a sphere elbow at every interior corner so the open
// cylinder ends stay hidden inside the joint — no exposed edges. The wall is
// transparent and animated liquid slugs show the flow direction inside.
export function PipeRun({
  points,
  radius = 0.12,
  color = "#d6e2ee",
  liquidColor = "#3a7ca5",
  showFlow = true,
  flowSelector,
  flowCount,
}) {
  return (
    <>
      {points.slice(0, -1).map((p, i) => (
        <Pipe key={`seg-${i}`} start={p} end={points[i + 1]} radius={radius} color={color} />
      ))}
      {points.slice(1, -1).map((p, i) => (
        <mesh key={`elbow-${i}`} position={p} renderOrder={2}>
          <sphereGeometry args={[radius * 1.35, 16, 16]} />
          <meshStandardMaterial
            color={color}
            metalness={0.3}
            roughness={0.2}
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </mesh>
      ))}
      {showFlow && (
        <FlowDots
          points={points}
          radius={radius}
          color={liquidColor}
          {...(flowSelector ? { selector: flowSelector } : {})}
          {...(flowCount ? { count: flowCount } : {})}
        />
      )}
    </>
  );
}
