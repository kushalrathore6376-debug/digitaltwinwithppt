import { useRef } from "react";
import { ShellVessel } from "../components/exterior/ShellVessel.jsx";
import { Structure } from "../components/exterior/Structure.jsx";
import { PipeSkin } from "../components/exterior/PipeSkin.jsx";
import { ThreeWayValve } from "../components/exterior/ThreeWayValve.jsx";
import { LineValve } from "../components/exterior/LineValve.jsx";
import { useMachineIdle } from "../components/useMachineIdle.js";
import { Section } from "../tour/Section.jsx";
import { SECTION } from "../tour/stages.js";
import {
  galvanised,
  paintedSteel,
  safetyYellow,
  checkerPlate,
} from "../materials/industrial.js";
import {
  LIFT,
  VESSEL_A_LOCAL,
  VESSEL_B_LOCAL,
  COLUMN_POSITION,
  COLUMN_RADIUS,
  COLUMN_CENTER_Y,
  COLUMN_BASE_Y,
  columnDrainRoute,
  BRANCH_TEE,
  solventFeedTee,
  FILTRATION_POSITION,
  FILTRATION_HEIGHT,
  FILTRATION_RADIUS,
  GRAPHITE_BIN_POSITION,
  decompTransferRoute,
  graphiteChuteRoute,
  solventReturnRoute,
  solventFeedRoute,
  solventFeedBranchRoute,
  SOLVENT_FEED_VALVE_POS,
  SOLVENT_RETURN_VALVE_POS,
  RECOVERED_POSITION,
  RECOVERED_HEIGHT,
  RECOVERED_RADIUS,
  WATER_HEIGHT,
  SHELL_RADIUS,
  STORAGE_SHELL_RADIUS,
  DECOMP_SHELL_RADIUS,
  HEAD_RATIO,
  DECK_Y,
  BASE_HEIGHT,
  BASE_POSITION,
  DECOMP_POSITION,
  DECOMP_HEIGHT,
  storageTransferRoute,
  drainRoute,
  gasSupplyRoute,
  gasMainRoute,
  gasBranchRoute,
  ventRoute,
} from "../layout.js";
import { VESSEL_HEIGHT } from "../components/Vessel.jsx";

// Height of skirt needed to carry a vessel from its bottom head down to the
// deck. Derived, never typed in — the shell has to land exactly on the deck.
function skirtToDeck(centerY, height) {
  return centerY - height / 2 - SHELL_RADIUS * HEAD_RATIO - DECK_Y;
}

const A_CENTER = LIFT + VESSEL_A_LOCAL[1];
const B_CENTER = LIFT + VESSEL_B_LOCAL[1];

// Drive motor standing on the decomposition chamber: cast housing, cooling
// fins, end bells and a terminal box, all in the machine's own blue. The
// grey cowl and guard that used to cap it read as a separate object stuck
// on top rather than part of the motor, so they are gone.
function DriveMotor({ position }) {
  const bodyH = 0.9;
  const cast = paintedSteel("#3f56c4");
  const bodyRef = useRef();

  // The exterior layer is otherwise still. This is the exception, and it is
  // worth the frame: a motor that trembles is unmistakably running, and it
  // costs one object's transform per frame.
  useMachineIdle(bodyRef, (s) => s.decompFill > 0);

  return (
    <group position={position} ref={bodyRef}>
      {/* mounting plinth — part of the vessel, so it stays vessel-coloured */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.55, 0.62, 0.2, 24]} />
        <meshStandardMaterial {...galvanised("#79808a")} />
      </mesh>

      {/* main body with cooling fins */}
      <mesh position={[0, bodyH / 2 + 0.1, 0]}>
        <cylinderGeometry args={[0.36, 0.36, bodyH, 32]} />
        <meshStandardMaterial {...cast} />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i * Math.PI * 2) / 16;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.39, bodyH / 2 + 0.1, Math.sin(a) * 0.39]}
            rotation={[0, -a, 0]}
           
          >
            <boxGeometry args={[0.055, bodyH * 0.88, 0.085]} />
            <meshStandardMaterial {...paintedSteel("#3549a8")} />
          </mesh>
        );
      })}

      {/* end bells */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.42, 0.34, 0.22, 32]} />
        <meshStandardMaterial {...cast} />
      </mesh>
      <mesh position={[0, bodyH + 0.16, 0]}>
        <cylinderGeometry args={[0.36, 0.42, 0.22, 32]} />
        <meshStandardMaterial {...cast} />
      </mesh>

      {/* terminal box, in the machine's own colour */}
      <mesh position={[0.44, bodyH * 0.6, 0]}>
        <boxGeometry args={[0.28, 0.3, 0.34]} />
        <meshStandardMaterial {...paintedSteel("#33459f")} />
      </mesh>
    </group>
  );
}

// Field control cabinet at grade, with a cable tray running back toward the
// structure. Pure set dressing, but it's what makes a plant look operated.
function ControlCabinet({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[1.3, 0.12, 0.8]} />
        <meshStandardMaterial {...galvanised("#5d656d")} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[1.15, 1.66, 0.62]} />
        <meshStandardMaterial {...paintedSteel("#8d949b")} />
      </mesh>
      {/* door seam and handle */}
      <mesh position={[0, 0.95, 0.315]}>
        <boxGeometry args={[1.02, 1.5, 0.02]} />
        <meshStandardMaterial {...paintedSteel("#7d858c")} />
      </mesh>
      <mesh position={[0.42, 0.95, 0.35]}>
        <boxGeometry args={[0.06, 0.22, 0.05]} />
        <meshStandardMaterial {...galvanised("#3a4048")} />
      </mesh>
      {/* sun canopy */}
      <mesh position={[0, 1.83, 0.06]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[1.34, 0.05, 0.84]} />
        <meshStandardMaterial {...galvanised("#6d757d")} />
      </mesh>
      <mesh position={[0, 0.4, 0.34]}>
        <boxGeometry args={[0.3, 0.16, 0.03]} />
        <meshStandardMaterial {...safetyYellow()} />
      </mesh>
    </group>
  );
}

// Open-topped skip the separated graphite drops into.
function GraphiteBin() {
  const [bx, , bz] = GRAPHITE_BIN_POSITION;
  return (
    <group position={[bx, 0, bz]}>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.62, 0.55, 0.84, 20, 1, true]} />
        <meshStandardMaterial {...galvanised("#6a727a")} side={2} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.58, 0.58, 0.08, 20]} />
        <meshStandardMaterial {...galvanised("#5b636b")} />
      </mesh>
      {/* lifting lugs */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.62, 0.66, 0]}>
          <boxGeometry args={[0.12, 0.1, 0.28]} />
          <meshStandardMaterial {...galvanised("#7d858d")} />
        </mesh>
      ))}
    </group>
  );
}

// Everything the public sees by default: the plant as built, opaque and
// lit, hiding the process detail the cutaway view exposes.
export function ExteriorLayer() {
  const drainA = drainRoute(VESSEL_A_LOCAL);
  const drainB = drainRoute(VESSEL_B_LOCAL);

  return (
    <group>
      <Section id={SECTION.STRUCTURE}>
        <Structure />
        <ControlCabinet position={[-5.2, 0, 4.4]} />
        {/* small maintenance platform at grade between the two tanks */}
        <mesh position={[-2.6, 0.07, 2.6]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[2.2, 0.1, 1.4]} />
          <meshStandardMaterial {...checkerPlate("#6f767d")} />
        </mesh>
      </Section>

      <Section id={SECTION.ABSORPTION}>
      {/* the two absorption chambers, elevated on the deck */}
      <ShellVessel
        position={[VESSEL_A_LOCAL[0], A_CENTER, 0]}
        radius={SHELL_RADIUS}
        height={VESSEL_HEIGHT}
        tint="#8ea6bd"
        tag="V-101 A"
        title="ABSORPTION CHAMBER"
        bands={2}
        accent="#2f6f97"
        skirt={{ height: skirtToDeck(A_CENTER, VESSEL_HEIGHT) }}
      />

      <ShellVessel
        position={[VESSEL_B_LOCAL[0], B_CENTER, 0]}
        radius={SHELL_RADIUS}
        height={VESSEL_HEIGHT}
        tint="#b09272"
        tag="V-101 B"
        title="ABSORPTION CHAMBER"
        bands={2}
        accent="#9a6a2f"
        skirt={{ height: skirtToDeck(B_CENTER, VESSEL_HEIGHT) }}
      />

        {/* the gas lines that belong to the chambers: the main run in, the
            branch to B, and the two outlet vents */}
        <PipeSkin
          points={gasMainRoute()}
          radius={0.08}
          tint="#ccd6e0"
        />
        <PipeSkin
          points={gasBranchRoute()}
          radius={0.08}
          tint="#ccd6e0"
        />
        {/* three-way valve on the gas header above B: this is the junction
            that decides which chamber is on duty */}
        <ThreeWayValve position={BRANCH_TEE} radius={0.11} />
        {/* and the one that charges the selected chamber with solvent */}
        <ThreeWayValve position={solventFeedTee()} radius={0.11} />

        <PipeSkin points={ventRoute(VESSEL_A_LOCAL)} radius={0.08} tint="#c4cfda" />
        <PipeSkin points={ventRoute(VESSEL_B_LOCAL)} radius={0.08} tint="#c4cfda" />
      </Section>

      {/* water column, standing at grade under the deck */}
      <Section id={SECTION.COLUMN}>
        <ShellVessel
          position={[COLUMN_POSITION[0], COLUMN_CENTER_Y, COLUMN_POSITION[2]]}
          radius={COLUMN_RADIUS + 0.14}
          height={WATER_HEIGHT}
          tint="#7f96ab"
          tag="C-201"
          title="WATER COLUMN"
          bands={1}
          skirt={{ height: COLUMN_BASE_Y }}
          nozzles={[
            {
              position: [0, WATER_HEIGHT / 2 + (COLUMN_RADIUS + 0.14) * HEAD_RATIO - 0.08, 0],
              radius: 0.09,
            },
          ]}
        />
        {/* bottom drain and the external make-up line into the top */}
        <PipeSkin points={columnDrainRoute()} radius={0.11} />
      </Section>

      {/* supply line from the stack tap into the column */}
      <Section id={SECTION.SOURCE}>
        <PipeSkin
          points={gasSupplyRoute()}
          radius={0.08}
          tint="#ccd6e0"
        />
      </Section>

      {/* storage tank at grade, under the deck, and the chamber drains
          that feed it */}
      <Section id={SECTION.STORAGE}>
      <ShellVessel
        position={[BASE_POSITION[0], BASE_HEIGHT / 2, BASE_POSITION[2]]}
        radius={STORAGE_SHELL_RADIUS}
        height={BASE_HEIGHT}
        tint="#7d848b"
        tag="T-301"
        title="SOLVENT STORAGE"
        bands={2}
        accent="#4a6d8c"
        flatBottom
      />
        <PipeSkin
          points={drainA.slice(0, -1)}
          radius={0.12}
          tint="#c4cfda"
        />
        <PipeSkin
          points={drainB}
          radius={0.12}
          tint="#c4cfda"
        />
      </Section>

      {/* decomposition chamber with its drive motor on top, and the low
          transfer line that feeds it from storage */}
      <Section id={SECTION.DECOMPOSITION}>
      <ShellVessel
        position={[DECOMP_POSITION[0], DECOMP_HEIGHT / 2, DECOMP_POSITION[2]]}
        radius={DECOMP_SHELL_RADIUS}
        height={DECOMP_HEIGHT}
        tint="#79808a"
        tag="R-401"
        title="DECOMPOSITION"
        bands={2}
        accent="#3d8f8f"
        flatBottom
      />
      <DriveMotor
        position={[
          DECOMP_POSITION[0],
          DECOMP_HEIGHT + DECOMP_SHELL_RADIUS * HEAD_RATIO - 0.06,
          DECOMP_POSITION[2],
        ]}
      />
        <PipeSkin
          points={storageTransferRoute()}
          radius={0.12}
          tint="#c4cfda"
        />
      </Section>

      {/* filtration: the batch is split into graphite and reusable solvent */}
      <Section id={SECTION.FILTRATION}>
        <ShellVessel
          position={[FILTRATION_POSITION[0], FILTRATION_HEIGHT / 2, FILTRATION_POSITION[2]]}
          radius={FILTRATION_RADIUS + 0.14}
          height={FILTRATION_HEIGHT}
          tint="#75828a"
          tag="F-501"
          title="FILTRATION"
          bands={2}
          accent="#5a8f7b"
          flatBottom
        />
        <PipeSkin points={decompTransferRoute()} radius={0.12} />
        <PipeSkin points={graphiteChuteRoute()} radius={0.14} />
        <PipeSkin points={solventReturnRoute()} radius={0.12} />
        {/* isolation valve where the return line leaves the filter */}
        <LineValve
          position={SOLVENT_RETURN_VALVE_POS}
          radius={0.12}
          yaw={Math.PI / 2}
          openSelector={(s) => s.filtrationRunning}
        />
        <GraphiteBin />

        {/* clean solvent gets its own tank, and feeds the chambers from it */}
        <ShellVessel
          position={[
            RECOVERED_POSITION[0],
            RECOVERED_HEIGHT / 2,
            RECOVERED_POSITION[2],
          ]}
          radius={RECOVERED_RADIUS + 0.14}
          height={RECOVERED_HEIGHT}
          tint="#7f8f88"
          tag="T-602"
          title="RECOVERED SOLVENT"
          bands={1}
          accent="#7fb8a2"
          flatBottom
        />
        <PipeSkin points={solventFeedRoute()} radius={0.1} />
        <PipeSkin points={solventFeedBranchRoute()} radius={0.1} />
        {/* isolation valve at the start of the feed, on the tank spur */}
        <LineValve
          position={SOLVENT_FEED_VALVE_POS}
          radius={0.1}
          openSelector={(s) => s.solventFeeding}
        />
      </Section>
    </group>
  );
}
