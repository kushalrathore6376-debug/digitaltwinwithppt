import { CHIMNEY_X, CHIMNEY_TOP_Y } from "../layout.js";
import { concrete, galvanised, paintedSteel } from "../materials/industrial.js";

const BASE_H = 1.4; // pedestal height
const SHAFT_BOTTOM_R = 0.95;
const SHAFT_TOP_R = 0.55;

// Shaft radius at a given height (linear taper)
function shaftRadiusAt(y) {
  const t = (y - BASE_H) / (CHIMNEY_TOP_Y - BASE_H);
  return SHAFT_BOTTOM_R + (SHAFT_TOP_R - SHAFT_BOTTOM_R) * t;
}

// Industrial flue stack: wide pedestal, tapered concrete shaft with
// reinforcement bands, marker stripes, a climbing ladder, a top collar, and
// a dark flue opening the smoke rises from.
export function Chimney() {
  const shaftH = CHIMNEY_TOP_Y - BASE_H;
  const shell = concrete("#7c7e7c");
  const trim = concrete("#6c6e6d");

  return (
    <group position={[CHIMNEY_X, 0, 0]}>
      {/* pedestal */}
      <mesh position={[0, BASE_H / 2, 0]}>
        <cylinderGeometry args={[SHAFT_BOTTOM_R + 0.2, SHAFT_BOTTOM_R + 0.42, BASE_H, 40]} />
        <meshStandardMaterial {...concrete("#6a6c6b")} />
      </mesh>

      {/* tapered shaft */}
      <mesh position={[0, BASE_H + shaftH / 2, 0]}>
        <cylinderGeometry args={[SHAFT_TOP_R, SHAFT_BOTTOM_R, shaftH, 48]} />
        <meshStandardMaterial {...shell} />
      </mesh>

      {/* reinforcement bands along the shaft */}
      {[3.5, 6.2, 8.9].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[shaftRadiusAt(y) + 0.05, shaftRadiusAt(y) + 0.05, 0.2, 48]} />
          <meshStandardMaterial {...trim} />
        </mesh>
      ))}

      {/* aviation marker stripes near the top */}
      {[CHIMNEY_TOP_Y - 0.85, CHIMNEY_TOP_Y - 2.1].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry
            args={[shaftRadiusAt(y) + 0.035, shaftRadiusAt(y) + 0.035, 0.42, 48]}
          />
          <meshStandardMaterial {...paintedSteel("#a8423a")} />
        </mesh>
      ))}

      {/* climbing ladder up the back of the stack */}
      {Array.from({ length: Math.floor((CHIMNEY_TOP_Y - 1.6) / 0.34) }, (_, i) => {
        const y = 1.6 + i * 0.34;
        const r = shaftRadiusAt(y) + 0.16;
        return (
          <mesh key={i} position={[0, y, -r]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, 0.42, 6]} />
            <meshStandardMaterial {...galvanised("#7b838b")} />
          </mesh>
        );
      })}

      {/* top collar and dark flue opening */}
      <mesh position={[0, CHIMNEY_TOP_Y - 0.25, 0]}>
        <cylinderGeometry args={[SHAFT_TOP_R + 0.16, SHAFT_TOP_R + 0.06, 0.5, 48]} />
        <meshStandardMaterial {...concrete("#5c5f61")} />
      </mesh>
      {/* recessed flue: an open tube so you look down into darkness rather
          than at a flat disc */}
      <mesh position={[0, CHIMNEY_TOP_Y - 0.35, 0]}>
        <cylinderGeometry args={[SHAFT_TOP_R - 0.03, SHAFT_TOP_R - 0.03, 0.9, 40, 1, true]} />
        <meshStandardMaterial color="#0c0e10" roughness={1} side={2} />
      </mesh>
    </group>
  );
}
