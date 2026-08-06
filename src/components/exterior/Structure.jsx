import { useMemo } from "react";
import * as THREE from "three";
import {
  galvanised,
  checkerPlate,
  safetyYellow,
} from "../../materials/industrial.js";
import {
  DECK_Y,
  DECK_X,
  DECK_Z,
  DECK_THICKNESS,
  COLUMN_X,
  COLUMN_Z,
  COLUMN_SIZE,
  RAIL_HEIGHT,
  RAIL_RADIUS,
  KICKPLATE_HEIGHT,
  LADDER_X,
  LADDER_Z,
  LADDER_WIDTH,
  underDeckObstacles,
  deckPenetration,
} from "../../layout.js";

// A square-section member spanning two arbitrary points. Same derivation as
// the process pipes: length and orientation come from the endpoints, so a
// brace stays correct if the frame dimensions change.
function Strut({ from, to, size = 0.12, material }) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = new THREE.Vector3().subVectors(b, a);
    return {
      position: new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize()
      ),
      length: dir.length(),
    };
  }, [from, to]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <boxGeometry args={[size, length, size]} />
      <meshStandardMaterial {...(material ?? galvanised())} />
    </mesh>
  );
}

// Two-rail handrail with posts and a kick plate, running along one edge.
// `axis` is the direction the run travels; the rail is drawn from `from`
// to `to` at deck level.
function Handrail({ from, to, spacing = 1.5 }) {
  const steel = galvanised("#98a0a8");
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = new THREE.Vector3().subVectors(b, a);
  const length = dir.length();
  const count = Math.max(2, Math.round(length / spacing) + 1);
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  const angle = Math.atan2(dir.x, dir.z);

  return (
    <group>
      {/* posts */}
      {Array.from({ length: count }, (_, i) => {
        const p = a.clone().lerp(b, i / (count - 1));
        return (
          <mesh
            key={i}
            position={[p.x, DECK_Y + RAIL_HEIGHT / 2, p.z]}
           
          >
            <cylinderGeometry args={[RAIL_RADIUS, RAIL_RADIUS, RAIL_HEIGHT, 10]} />
            <meshStandardMaterial {...steel} />
          </mesh>
        );
      })}
      {/* top and mid rails */}
      {[RAIL_HEIGHT, RAIL_HEIGHT * 0.55].map((h) => (
        <mesh
          key={h}
          position={[mid.x, DECK_Y + h, mid.z]}
          rotation={[Math.PI / 2, 0, angle]}
         
        >
          <cylinderGeometry args={[RAIL_RADIUS, RAIL_RADIUS, length, 10]} />
          <meshStandardMaterial {...steel} />
        </mesh>
      ))}
      {/* kick plate along the deck edge */}
      <mesh
        position={[mid.x, DECK_Y + KICKPLATE_HEIGHT / 2 + 0.02, mid.z]}
        rotation={[0, angle, 0]}
       
      >
        <boxGeometry args={[0.03, KICKPLATE_HEIGHT, length]} />
        <meshStandardMaterial {...safetyYellow()} />
      </mesh>
    </group>
  );
}

// Access ladder from grade up to the deck: two stringers, rungs, and the
// pair of handhold extensions that carry above deck level so there is
// something to hold stepping off.
//
// It had a hooped safety cage, which at this scale read as a stack of
// detached rings floating beside the plant rather than as a cage, so it is
// gone — the ladder now simply bolts to the deck edge.
function AccessLadder() {
  const steel = galvanised("#8e969e");
  const top = DECK_Y;
  const rungs = Math.floor(top / 0.32);

  return (
    <group position={[LADDER_X, 0, LADDER_Z]}>
      {/* stringers, carried up past the deck as grab rails */}
      {[-LADDER_WIDTH / 2, LADDER_WIDTH / 2].map((x) => (
        <mesh key={x} position={[x, (top + RAIL_HEIGHT) / 2, 0]}>
          <boxGeometry args={[0.07, top + RAIL_HEIGHT, 0.12]} />
          <meshStandardMaterial {...steel} />
        </mesh>
      ))}
      {/* rungs */}
      {Array.from({ length: rungs }, (_, i) => (
        <mesh
          key={i}
          position={[0, 0.32 * (i + 1), 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.028, 0.028, LADDER_WIDTH, 8]} />
          <meshStandardMaterial {...steel} />
        </mesh>
      ))}
      {/* brackets tying the stringers back to the deck edge beam */}
      {[-LADDER_WIDTH / 2, LADDER_WIDTH / 2].map((x) => (
        <mesh key={`tie-${x}`} position={[x, DECK_Y - 0.3, 0.09]}>
          <boxGeometry args={[0.06, 0.12, 0.2]} />
          <meshStandardMaterial {...steel} />
        </mesh>
      ))}
    </group>
  );
}

// The elevated steel structure the chambers stand on. In the schematic the
// vessels simply float; here they are carried by a braced frame with a
// checker-plate deck, handrails and an access ladder — which is also what
// gives the scene its sense of human scale.
export function Structure() {
  const beam = galvanised("#7c848c");
  const obstacles = underDeckObstacles();
  const deckWidth = DECK_X[1] - DECK_X[0];
  const deckDepth = DECK_Z[1] - DECK_Z[0];
  const deckCx = (DECK_X[0] + DECK_X[1]) / 2;
  const deckCz = (DECK_Z[0] + DECK_Z[1]) / 2;

  return (
    <group>
      {/* deck plate */}
      <mesh position={[deckCx, DECK_Y - DECK_THICKNESS / 2, deckCz]}>
        <boxGeometry args={[deckWidth, DECK_THICKNESS, deckDepth]} />
        <meshStandardMaterial {...checkerPlate()} />
      </mesh>

      {/* main edge beams under the deck */}
      {DECK_Z.map((z) => (
        <mesh
          key={`beam-z-${z}`}
          position={[deckCx, DECK_Y - DECK_THICKNESS - 0.16, z - Math.sign(z) * 0.12]}
         
        >
          <boxGeometry args={[deckWidth, 0.34, 0.16]} />
          <meshStandardMaterial {...beam} />
        </mesh>
      ))}
      {COLUMN_X.map((x) => (
        <mesh
          key={`beam-x-${x}`}
          position={[x, DECK_Y - DECK_THICKNESS - 0.16, deckCz]}
         
        >
          <boxGeometry args={[0.16, 0.34, deckDepth]} />
          <meshStandardMaterial {...beam} />
        </mesh>
      ))}

      {/* columns with base plates */}
      {COLUMN_X.flatMap((x) =>
        COLUMN_Z.map((z) => (
          <group key={`col-${x}-${z}`}>
            <mesh position={[x, (DECK_Y - 0.5) / 2, z]}>
              <boxGeometry args={[COLUMN_SIZE, DECK_Y - 0.5, COLUMN_SIZE]} />
              <meshStandardMaterial {...beam} />
            </mesh>
            <mesh position={[x, 0.04, z]}>
              <boxGeometry args={[COLUMN_SIZE * 2.1, 0.08, COLUMN_SIZE * 2.1]} />
              <meshStandardMaterial {...galvanised("#666e76")} />
            </mesh>
          </group>
        ))
      )}

      {/* X bracing between column bays, on the back plane only so the front
          of the plant stays readable. A bay is braced only if nothing
          stands under it — the storage tank sits inside the middle bay, and
          the braces used to run clean through it. */}
      {COLUMN_X.slice(0, -1).map((x, i) => {
        const nextX = COLUMN_X[i + 1];
        const blocked = obstacles.some(
          ([minX, maxX]) => nextX > minX && x < maxX
        );
        if (blocked) return null;
        const z = COLUMN_Z[0];
        const low = 0.6;
        const high = DECK_Y - 0.7;
        return (
          <group key={`brace-${x}`}>
            <Strut from={[x, low, z]} to={[nextX, high, z]} size={0.1} material={beam} />
            <Strut from={[nextX, low, z]} to={[x, high, z]} size={0.1} material={beam} />
          </group>
        );
      })}

      {/* handrails around the deck, with the run on the ladder side split
          so there is an opening to step through */}
      <Handrail from={[DECK_X[0], 0, DECK_Z[1]]} to={[DECK_X[1], 0, DECK_Z[1]]} />
      <Handrail from={[DECK_X[0], 0, DECK_Z[0]]} to={[LADDER_X - LADDER_WIDTH, 0, DECK_Z[0]]} />
      <Handrail from={[LADDER_X + LADDER_WIDTH, 0, DECK_Z[0]]} to={[DECK_X[1], 0, DECK_Z[0]]} />
      <Handrail from={[DECK_X[0], 0, DECK_Z[0]]} to={[DECK_X[0], 0, DECK_Z[1]]} />
      <Handrail from={[DECK_X[1], 0, DECK_Z[0]]} to={[DECK_X[1], 0, DECK_Z[1]]} />

      {/* collar where the gas riser out of the water column passes through
          the deck plate — a riser under a walkway gets a penetration, not a
          detour around it */}
      <mesh position={[deckPenetration()[0], DECK_Y - 0.02, deckPenetration()[2]]}>
        <cylinderGeometry args={[0.3, 0.34, 0.3, 20]} />
        <meshStandardMaterial {...galvanised("#6a727a")} />
      </mesh>

      <AccessLadder />
    </group>
  );
}
