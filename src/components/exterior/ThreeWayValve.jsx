import { galvanised, stainless, safetyYellow } from "../../materials/industrial.js";

// Three-way valve, for the junctions where a line splits and the flow has
// to be sent one way or the other.
//
// A tee on its own is just a fitting — it explains where the pipe goes but
// not how anything is controlled. These sit on the two branch points that
// actually decide the process: the gas tee that selects the duty absorption
// chamber, and the solvent feed tee that charges it.
//
// `axes` names the two run directions the body sits on, so the three ports
// point down the actual pipes rather than in arbitrary directions:
//   "xy" — a horizontal run in X with a branch down (the gas header)
//   "zy" — a horizontal run in Z with a branch down
export function ThreeWayValve({ position, radius = 0.13, axes = "xy" }) {
  const body = galvanised("#79828c");
  const port = stainless("#c3ccd6");
  const portLength = radius * 2.6;

  // the two ends of the through-run, plus the branch pointing down
  const runOffsets =
    axes === "zy"
      ? [
          [0, 0, portLength],
          [0, 0, -portLength],
        ]
      : [
          [portLength, 0, 0],
          [-portLength, 0, 0],
        ];
  const runRotation = axes === "zy" ? [Math.PI / 2, 0, 0] : [0, 0, Math.PI / 2];

  return (
    <group position={position}>
      {/* valve body */}
      <mesh>
        <sphereGeometry args={[radius * 1.85, 18, 14]} />
        <meshStandardMaterial {...body} />
      </mesh>

      {/* the two through ports */}
      {runOffsets.map((offset, i) => (
        <mesh key={i} position={offset} rotation={runRotation}>
          <cylinderGeometry args={[radius * 1.15, radius * 1.15, portLength * 1.6, 14]} />
          <meshStandardMaterial {...port} />
        </mesh>
      ))}

      {/* the branch port, pointing down the drop leg */}
      <mesh position={[0, -portLength, 0]}>
        <cylinderGeometry args={[radius * 1.15, radius * 1.15, portLength * 1.6, 14]} />
        <meshStandardMaterial {...port} />
      </mesh>

      {/* Actuator on top. Deliberately plain for now — a compact block on
          a short stem — pending the valve reference to model properly. The
          handwheel that was here read as a ship's helm bolted to a pipe. */}
      <mesh position={[0, radius * 2.1, 0]}>
        <cylinderGeometry args={[radius * 0.42, radius * 0.5, radius * 1.1, 12]} />
        <meshStandardMaterial {...body} />
      </mesh>
      <mesh position={[0, radius * 3.05, 0]}>
        <boxGeometry args={[radius * 1.5, radius * 0.9, radius * 1.1]} />
        <meshStandardMaterial {...safetyYellow()} />
      </mesh>
    </group>
  );
}
