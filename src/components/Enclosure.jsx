import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { openAmount, stagger } from "../scene/reveal.js";
import { useLogoTexture, LOGO_ASPECT } from "../materials/logo.js";
import {
  ENCLOSURE_MIN,
  ENCLOSURE_MAX,
  ENCLOSURE_PORT,
  ENCLOSURE_GATE,
  ENCLOSURE_RAIL,
} from "../layout.js";

const [X0, Y0, Z0] = ENCLOSURE_MIN;
const [X1, Y1, Z1] = ENCLOSURE_MAX;
const CX = (X0 + X1) / 2;
const CY = (Y0 + Y1) / 2;
const CZ = (Z0 + Z1) / 2;
const SPAN_X = X1 - X0;
const SPAN_Y = Y1 - Y0;
const SPAN_Z = Z1 - Z0;

const POST = 0.3; // corner column section
const RAIL = ENCLOSURE_RAIL; // top and bottom rail section
const CASTING = [0.5, 0.38, 0.5];

const PORT_HALF = ENCLOSURE_PORT.size / 2;
const PORT_Y = ENCLOSURE_PORT.y;
const PORT_Z = ENCLOSURE_PORT.z;

// Personnel gate in the -Z wall, at the foot of the access ladder
const GATE_HALF = ENCLOSURE_GATE.width / 2;
const GATE_X = ENCLOSURE_GATE.x;
const GATE_TOP = ENCLOSURE_GATE.height;

const WALL_ROT = [0, Math.PI / 2, 0]; // plane faces ±X; its width runs in Z
const ROOF_ROT = [-Math.PI / 2, 0, 0]; // plane faces +Y; its width runs in X

// The mark is the only thing on the box worth reading, so it gets most of the
// wall. Two thirds of the height between the rails, centred.
const LOGO_HEIGHT = (Y1 - Y0 - 2 * RAIL) * 0.66;

// The two colours out of the mark, used on the frame so the box and the badge
// read as one object rather than a badge stuck on a shipping container.
const BRAND_ORANGE = "#e4633a";
const BRAND_GREEN = "#5f8e3e";

// The plant's housing.
//
// Deliberately plain: white panels, a green frame, eight orange castings and
// the mark across the middle, and that is the whole model. An earlier version
// carried every corrugation fold, which was three hundred-odd boxes drawn to
// say something the silhouette already says. The container exists to make one
// point — the entire process ships inside a box you could put on a truck —
// and a flat white box makes that point at a fraction of the cost. It is also
// the right canvas for the mark, which is the only thing on it worth reading.
//
// This is the outermost of the three layers and it behaves like the exterior
// shell does one level in: solid while it is the current view, and gone once
// you step past it. It never lingers as a translucent boundary — a half-there
// box reads as a rendering artefact, and the whole point is that the unit
// ships sealed, which only lands if the box is genuinely opaque.
export function Enclosure() {
  const groupRef = useRef();
  const logo = useLogoTexture();

  const { body, frame, castings, hardware, mark } = useMemo(() => {
    const panel = (color) =>
      new THREE.MeshStandardMaterial({
        color,
        metalness: 0.15,
        roughness: 0.62,
        side: THREE.DoubleSide,
      });
    return {
      body: panel("#e9ebee"),
      // edges green, corner castings orange — straight off the mark
      frame: panel(BRAND_GREEN),
      castings: panel(BRAND_ORANGE),
      hardware: panel("#8d959e"),
      // unlit, so the mark keeps its brand colours whatever the key light is
      // doing to the panel behind it
      mark: new THREE.MeshBasicMaterial({
        transparent: true,
        toneMapped: false,
        depthWrite: false,
        // Front-facing only, and each plane below is turned to face out.
        // Double-siding it instead would have worked too, right up until you
        // walked round the box and read the mark backwards.
      }),
    };
  }, []);

  // The material is created once and outlives the texture's async load, so
  // the map is attached whenever it turns up rather than passed as a prop.
  if (logo && mark.map !== logo) {
    mark.map = logo;
    mark.needsUpdate = true;
  }

  const bases = useMemo(
    () => [body, frame, castings, hardware, mark],
    [body, frame, castings, hardware, mark],
  );

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    // 1 while sealed, 0 once the box has opened. The tail of the step does
    // the fading, so the container holds solid for the first part of the
    // move and then goes, rather than dissolving from the first frame.
    const present = 1 - stagger(openAmount(), 0.25, 1);
    const gone = present <= 0.002;
    group.visible = !gone;
    if (gone) return;

    const solid = present > 0.985;
    for (const material of bases) {
      material.opacity = present;
      // A sealed box has to write depth, or the plant shows straight through
      // it. A fading one must not, for exactly the reason the ground pad must
      // not: a twenty-metre panel in the sorted pass would stamp the depth
      // buffer and reject everything standing behind it. The mark is always
      // in the sorted pass — it is a decal on a wall that already wrote.
      material.transparent = !solid || material === mark;
      material.depthWrite = solid && material !== mark;
    }
  });

  return (
    <group ref={groupRef}>
      {/* --- panels -------------------------------------------------------- */}
      {/* -Z wall, in three pieces around the personnel gate */}
      <mesh position={[CX, (GATE_TOP + Y1) / 2, Z0]} material={body}>
        <planeGeometry args={[SPAN_X, Y1 - GATE_TOP]} />
      </mesh>
      <mesh
        position={[(X0 + GATE_X - GATE_HALF) / 2, GATE_TOP / 2, Z0]}
        material={body}
      >
        <planeGeometry args={[GATE_X - GATE_HALF - X0, GATE_TOP]} />
      </mesh>
      <mesh
        position={[(GATE_X + GATE_HALF + X1) / 2, GATE_TOP / 2, Z0]}
        material={body}
      >
        <planeGeometry args={[X1 - GATE_X - GATE_HALF, GATE_TOP]} />
      </mesh>
      <mesh position={[CX, CY, Z1]} material={body}>
        <planeGeometry args={[SPAN_X, SPAN_Y]} />
      </mesh>
      <mesh position={[X0, CY, CZ]} rotation={WALL_ROT} material={body}>
        <planeGeometry args={[SPAN_Z, SPAN_Y]} />
      </mesh>
      {/* Recessed a rail's depth below the top of the frame. It used to sit
          at exactly Y1, which is also where the top rails' upper faces are —
          two surfaces in the same plane, and the depth buffer picks a winner
          per pixel, which is the speckling that was crawling along the green
          edges. Dropping it also happens to be how a container roof is
          actually built: a panel set down inside its rails. */}
      <mesh position={[CX, Y1 - RAIL, CZ]} rotation={ROOF_ROT} material={body}>
        <planeGeometry args={[SPAN_X, SPAN_Z]} />
      </mesh>

      {/* +X end, in four pieces around the opening the flue line crosses */}
      <mesh
        position={[X1, (Y0 + PORT_Y - PORT_HALF) / 2, CZ]}
        rotation={WALL_ROT}
        material={body}
      >
        <planeGeometry args={[SPAN_Z, PORT_Y - PORT_HALF - Y0]} />
      </mesh>
      <mesh
        position={[X1, (PORT_Y + PORT_HALF + Y1) / 2, CZ]}
        rotation={WALL_ROT}
        material={body}
      >
        <planeGeometry args={[SPAN_Z, Y1 - PORT_Y - PORT_HALF]} />
      </mesh>
      <mesh
        position={[X1, PORT_Y, (Z0 + PORT_Z - PORT_HALF) / 2]}
        rotation={WALL_ROT}
        material={body}
      >
        <planeGeometry args={[PORT_Z - PORT_HALF - Z0, 2 * PORT_HALF]} />
      </mesh>
      <mesh
        position={[X1, PORT_Y, (PORT_Z + PORT_HALF + Z1) / 2]}
        rotation={WALL_ROT}
        material={body}
      >
        <planeGeometry args={[Z1 - PORT_Z - PORT_HALF, 2 * PORT_HALF]} />
      </mesh>

      {/* --- frame: four corner posts and the two rail rings --------------- */}
      {[X0, X1].flatMap((x) =>
        [Z0, Z1].map((z) => (
          <mesh key={`post-${x}-${z}`} position={[x, CY, z]} material={frame}>
            <boxGeometry args={[POST, SPAN_Y, POST]} />
          </mesh>
        )),
      )}
      {[Y0 + RAIL / 2, Y1 - RAIL / 2].flatMap((y) => [
        ...[Z0, Z1].map((z) => (
          <mesh key={`rx-${y}-${z}`} position={[CX, y, z]} material={frame}>
            <boxGeometry args={[SPAN_X + POST, RAIL, RAIL]} />
          </mesh>
        )),
        ...[X0, X1].map((x) => (
          <mesh key={`rz-${y}-${x}`} position={[x, y, CZ]} material={frame}>
            <boxGeometry args={[RAIL, RAIL, SPAN_Z + POST]} />
          </mesh>
        )),
      ])}

      {/* --- corner castings: the one detail that says "container" --------- */}
      {[X0, X1].flatMap((x) =>
        [Z0, Z1].flatMap((z) =>
          // a hair proud of the frame at the top, for the same reason: flush
          // with the rail end meant two coplanar faces fighting at every
          // corner. Real castings stand out from the box anyway.
          [Y0 + CASTING[1] / 2, Y1 - CASTING[1] / 2 + 0.03].map((y) => (
            <mesh
              key={`cast-${x}-${y}-${z}`}
              position={[x, y, z]}
              material={castings}
            >
              <boxGeometry args={CASTING} />
            </mesh>
          )),
        ),
      )}

      {/* --- personnel gate ------------------------------------------------ */}
      {[-1, 1].map((side) => (
        <mesh
          key={`gate-post-${side}`}
          position={[GATE_X + side * (GATE_HALF + 0.07), GATE_TOP / 2, Z0]}
          material={hardware}
        >
          <boxGeometry args={[0.14, GATE_TOP, 0.2]} />
        </mesh>
      ))}
      <mesh position={[GATE_X, GATE_TOP + 0.07, Z0]} material={hardware}>
        <boxGeometry args={[2 * GATE_HALF + 0.28, 0.14, 0.2]} />
      </mesh>
      {/* just the framed opening — no leaf standing open beside it */}
      <mesh position={[GATE_X, 0.05, Z0 - 0.15]} material={hardware}>
        <boxGeometry args={[2 * GATE_HALF + 0.2, 0.1, 0.5]} />
      </mesh>

      {/* --- door seams and locking bars on the closed end ----------------- */}
      {[-1, 0, 1].map((s) => (
        <mesh
          key={`seam-${s}`}
          position={[X0 - 0.04, CY, CZ + (s * (SPAN_Z - POST)) / 2]}
          material={hardware}
        >
          <boxGeometry args={[0.1, SPAN_Y - 2 * RAIL, s === 0 ? 0.12 : 0.2]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh
          key={`bar-${s}`}
          position={[X0 - 0.11, CY, CZ + s * SPAN_Z * 0.22]}
          material={hardware}
        >
          <cylinderGeometry args={[0.06, 0.06, SPAN_Y - 1.1, 8]} />
        </mesh>
      ))}

      {/* --- the mark, on both long sides and the roof ----------------------
          Each plane is turned so its face points away from the box. The two
          long walls face opposite directions, so they cannot share a
          rotation — the wall panels are double-sided and do not care which
          way they point; a mark does, or it reads backwards.

          Not on the door end: that end opens, and a mark split down the
          middle by the gate seam is a mark that only works while the unit is
          shut. The roof carries it instead, which is also where it is worth
          having on something that ships. */}
      {logo &&
        [
          { key: "front", position: [CX, CY, Z1 + 0.05], rotation: [0, 0, 0] },
          {
            key: "back",
            position: [CX, CY, Z0 - 0.05],
            rotation: [0, Math.PI, 0],
          },
          // laid flat on the recessed roof panel, reading from the +Z side
          {
            key: "roof",
            position: [CX, Y1 - RAIL + 0.04, CZ],
            rotation: [-Math.PI / 2, 0, 0],
          },
        ].map(({ key, position, rotation }) => (
          <mesh
            key={key}
            position={position}
            rotation={rotation}
            material={mark}
          >
            <planeGeometry args={[LOGO_HEIGHT * LOGO_ASPECT, LOGO_HEIGHT]} />
          </mesh>
        ))}

      {/* --- collar framing the flue-line opening -------------------------- */}
      {[-1, 1].map((s) => (
        <mesh
          key={`port-y-${s}`}
          position={[X1, PORT_Y + s * (PORT_HALF + 0.08), PORT_Z]}
          material={hardware}
        >
          <boxGeometry args={[0.22, 0.16, 2 * PORT_HALF + 0.32]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh
          key={`port-z-${s}`}
          position={[X1, PORT_Y, PORT_Z + s * (PORT_HALF + 0.08)]}
          material={hardware}
        >
          <boxGeometry args={[0.22, 2 * PORT_HALF, 0.16]} />
        </mesh>
      ))}
    </group>
  );
}
