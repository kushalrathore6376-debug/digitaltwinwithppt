import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSimStore } from "../store.js";
import { galvanised, paintedSteel, rubber } from "../materials/industrial.js";
import {
  DAC_POSITION,
  DAC_BASE_Y,
  DAC_COLS,
  DAC_ROWS,
  DAC_PITCH,
  DAC_FAN_RADIUS,
  DAC_PLENUM,
} from "../layout.js";

const BLADES = 6;
const SPIN = 5.2; // radians a second at full tilt

// One ducted axial fan: a shroud, a hub, and a set of blades — a plain
// motor fan, nothing more.
//
// Each blade sits in its own group, rotated once around Z to its position
// on the hub; the blade's own pitch is a separate, fixed local tilt inside
// that group. Only the shared parent below is ever animated, and only
// around Z. Putting a blade's placement angle and its pitch tilt into one
// combined rotation on a single mesh — which is what this used to do — reads
// fine standing still, but the two rotations don't share an axis, so as the
// assembly spins the blade's apparent tilt swims instead of holding steady.
// Keeping the animated rotation on its own axis, with nothing else riding
// on top of it, is what keeps the blade rigid as it turns.
function Fan({ position, spinning }) {
  const rotorRef = useRef();

  useFrame((_, delta) => {
    const rotor = rotorRef.current;
    if (!rotor) return;
    // eased toward a stop rather than cut, so switching the bank off reads
    // as fans spinning down
    rotor.userData.rate ??= 0;
    const target = spinning() ? SPIN : 0;
    rotor.userData.rate +=
      (target - rotor.userData.rate) * Math.min(1, delta * 1.6);
    rotor.rotation.z += rotor.userData.rate * delta;
  });

  const r = DAC_FAN_RADIUS;

  return (
    <group position={position}>
      {/* shroud: the ring the fan is ducted through */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r, r, 0.4, 28, 1, true]} />
        <meshStandardMaterial {...galvanised("#d6edf8")} side={2} />
      </mesh>
      {/* the bore behind the blades, so the duct reads as open */}
      <mesh position={[0, 0, -0.21]}>
        <circleGeometry args={[r - 0.03, 28]} />
        <meshStandardMaterial color="#0b0b0b" roughness={1} />
      </mesh>

      <group ref={rotorRef} position={[0, 0, 0.04]}>
        {Array.from({ length: BLADES }, (_, i) => {
          const a = (i / BLADES) * Math.PI * 2;
          return (
            <group key={i} rotation={[0, 0, a]}>
              {/* straight radial blade, a slight fixed pitch to read as a
                  fan rather than a paddle wheel */}
              <mesh position={[r * 0.55, 0, 0]} rotation={[0, 0.28, 0]}>
                <boxGeometry args={[r * 0.85, r * 0.3, 0.03]} />
                <meshStandardMaterial {...paintedSteel("#5F8E3E")} />
              </mesh>
            </group>
          );
        })}
        {/* hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[r * 0.24, r * 0.27, 0.16, 16]} />
          <meshStandardMaterial {...galvanised("#fcf7f5")} />
        </mesh>
      </group>
    </group>
  );
}

// The direct-air-capture bank, mounted above the container roof.
//
// It is shared by all three views rather than belonging to the container:
// the fans are plant, not housing. Deliberately no legs down to the floor —
// it holds its height (roof level plus DAC_LIFT) in every view, so once the
// container itself is peeled away in the exterior and cutaway layers the
// bank is left sitting up in the air with nothing visibly under it. That is
// the intended read: a unit mounted on top of the box, not a structure that
// needs its own foundation.
export function DacFans() {
  const [dx, , dz] = DAC_POSITION;
  const [pw, ph, pd] = DAC_PLENUM;

  // Read straight from the store inside the frame loop rather than
  // subscribing: this changes once when someone hits the switch, and a
  // subscription would re-render six fans to do it.
  const spinning = () => useSimStore.getState().dacRunning;

  const grid = [];
  for (let col = 0; col < DAC_COLS; col++) {
    for (let row = 0; row < DAC_ROWS; row++) {
      grid.push([
        (col - (DAC_COLS - 1) / 2) * DAC_PITCH,
        DAC_BASE_Y + ph / 2 + (row - (DAC_ROWS - 1) / 2) * DAC_PITCH,
        pd / 2 + 0.02,
      ]);
    }
  }

  return (
    <group position={[dx, 0, dz]}>
      {/* the plenum the fans breathe into — white, matching the container
          it's mounted on */}
      <mesh position={[0, DAC_BASE_Y + ph / 2, 0]}>
        <boxGeometry args={[pw, ph, pd]} />
        <meshStandardMaterial {...paintedSteel("#e0e8f1")} />
      </mesh>
      {/* face plate, so the fans sit in a panel rather than on a slab */}
      <mesh position={[0, DAC_BASE_Y + ph / 2, pd / 2 + 0.01]}>
        <boxGeometry args={[pw - 0.1, ph - 0.1, 0.06]} />
        <meshStandardMaterial {...galvanised("#d4dbce")} />
      </mesh>

      {grid.map((p) => (
        <Fan key={`${p[0]}-${p[1]}`} position={p} spinning={spinning} />
      ))}

      {/* Base flange, under the plenum rather than around its foot. It used
          to be centred just above DAC_BASE_Y, which put its underside in the
          same plane as the plenum's — and with the bank flush on the roof,
          both of those in the plane of the roof panel as well. Three coplanar
          faces is a flicker, not a joint. It now fills the standoff exactly:
          plenum sits on flange, flange stands clear of the roof. */}
      <mesh position={[0, DAC_BASE_Y - 0.06, 0]}>
        <boxGeometry args={[pw + 0.2, 0.12, pd + 0.3]} />
        <meshStandardMaterial {...galvanised("#6f7880")} />
      </mesh>

      {/* flexible collar where the header leaves the plenum, dropping down
          to meet the duct below — the one part of this unit that is meant
          to sit below the roof line, out of sight from outside */}
      <mesh position={[0, DAC_BASE_Y - 0.1, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.2, 20]} />
        <meshStandardMaterial {...rubber()} />
      </mesh>
    </group>
  );
}
