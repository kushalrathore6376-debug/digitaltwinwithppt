import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { Vessel } from "../components/Vessel.jsx";
import { BaseUnit } from "../components/BaseUnit.jsx";
import { StorageTank } from "../components/StorageTank.jsx";
import { PipeRun, Valve, Sparger, FlowDots } from "../components/Pipe.jsx";
import { Bubbles, ColumnBubbles } from "../components/Bubbles.jsx";
import { Section } from "../tour/Section.jsx";
import { SECTION } from "../tour/stages.js";
import { useSimStore, isGasFlowing, GRAPHITE_PER_BATCH } from "../store.js";
import {
  GRADE_HEIGHT,
  GRADE_RADIUS,
  GRADE_SKIRT,
  LIFT,
  WATER_HEIGHT,
  VESSEL_A_LOCAL,
  VESSEL_B_LOCAL,
  COLUMN_POSITION,
  COLUMN_RADIUS,
  COLUMN_CENTER_Y,
  COLUMN_BASE_Y,
  columnDrainRoute,
  columnDrainValvePos,
  FILTRATION_POSITION,
  GRAPHITE_BIN_POSITION,
  decompTransferRoute,
  DECOMP_TRANSFER_VALVE_POS,
  graphiteChuteRoute,
  solventReturnRoute,
  solventFeedRoute,
  solventFeedBranchRoute,
  solventFeedTee,
  solventFlowPath,
  SOLVENT_A_VALVE_POS,
  inventoryChargeRoute,
  INVENTORY_CHARGE_VALVE_POS,
  SOLVENT_FEED_VALVE_POS,
  SOLVENT_RETURN_VALVE_POS,
  TREATMENT_POSITION,
  INVENTORY_POSITION,
  BASE_POSITION,
  DECOMP_POSITION,
  storageTransferRoute,
  TRANSFER_VALVE_POS,
  drainRoute,
  DAC_POSITION,
  DAC_TOP_Y,
  CHIMNEY_X,
  CHIMNEY_TOP_Y,
  CHIMNEY_RADIUS,
  BRANCH_TEE,
  gasSupplyRoute,
  dacDuctRoute,
  gasMainRoute,
  gasBranchRoute,
  gasFlowPath,
  gasBranchValvePos,
  GAS_A_VALVE_POS,
  GAS_HEADER_VALVE_POS,
  spargerPos,
  ventRoute,
  drainValvePos,
} from "../layout.js";

const GAS_PIPE = { radius: 0.08, color: "#d6e2ee", liquidColor: "#e4ecf2" };

// One label style for the whole schematic: text wrapped around the vessel
// wall, sized and coloured identically everywhere.
//
// Two things make this work where the first attempt didn't. Characters are
// spaced by their real advance width, so the gaps stay even on the curve
// instead of bunching under wide letters. And the whole ring turns to face
// the camera, so you always read the near side of the tank — before, the
// text was pinned to the shell and the far side showed through, doubling
// every label back over itself.
const LABEL_COLOR = "#e4ecf5";
const LABEL_SIZE = 0.27;

const NARROW_CHARS = "iIl.,;:'`|!";
const WIDE_CHARS = "mMW";
function charWidth(ch) {
  if (ch === " ") return 0.3;
  if (NARROW_CHARS.includes(ch)) return 0.3;
  if ("fjt".includes(ch)) return 0.38;
  if (WIDE_CHARS.includes(ch)) return 0.88;
  if (ch === ch.toUpperCase() && ch !== ch.toLowerCase()) return 0.66; // uppercase
  return 0.56; // default lowercase
}

function Label({ position, radius, fontSize = LABEL_SIZE, children }) {
  const groupRef = useRef();

  // Turn the ring so its centre always points at the camera.
  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const cam = state.camera.position;
    group.rotation.y = Math.atan2(cam.x - position[0], cam.z - position[2]);
  });

  const lines = String(children).split("\n");

  return (
    <group ref={groupRef} position={position}>
      {lines.map((line, lineIndex) => {
        const chars = [...line];
        const widths = chars.map((ch) => charWidth(ch) * fontSize);
        const totalArc = widths.reduce((a, w) => a + w, 0);
        // stack multiple lines about the anchor point
        const y = ((lines.length - 1) / 2 - lineIndex) * fontSize * 1.3;
        let arc = -totalArc / 2;
        return chars.map((ch, i) => {
          const angle = (arc + widths[i] / 2) / radius;
          arc += widths[i];
          if (ch === " ") return null;
          return (
            <Text
              key={`${lineIndex}-${i}`}
              position={[
                Math.sin(angle) * radius,
                y,
                Math.cos(angle) * radius,
              ]}
              rotation={[0, angle, 0]}
              fontSize={fontSize}
              color={LABEL_COLOR}
              anchorX="center"
              anchorY="middle"
              // annotation, not geometry: it stays readable through the
              // pipework rather than being half-buried in it
              depthTest={false}
              renderOrder={20}
            >
              {ch}
            </Text>
          );
        });
      })}
    </group>
  );
}

// Open-topped bin the separated graphite drops into. The heap inside grows
// with the running yield, so the output of the whole plant is something you
// can actually watch accumulate.
function GraphiteBin() {
  const heapRef = useRef();
  const [bx, , bz] = GRAPHITE_BIN_POSITION;

  useFrame(() => {
    const heap = heapRef.current;
    if (!heap) return;
    // one full bin is ten batches' worth; past that it just stays full
    const level = Math.min(1, useSimStore.getState().graphiteYield / (GRAPHITE_PER_BATCH * 10));
    heap.scale.set(1, Math.max(0.001, level), 1);
    heap.visible = level > 0.004;
  });

  return (
    <group position={[bx, 0, bz]}>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.62, 0.55, 0.84, 20, 1, true]} />
        <meshStandardMaterial
          color="#6b7280"
          metalness={0.4}
          roughness={0.55}
          side={THREE.DoubleSide}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={heapRef} position={[0, 0.06, 0]} visible={false}>
        <cylinderGeometry args={[0.5, 0.5, 0.7, 20]} />
        <meshBasicMaterial color="#23262b" transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  );
}

// The schematic X-ray view: translucent shells, visible liquid levels, the
// full pipe/valve/sparger circuit and the flow animations. Everything here
// is process detail — the exterior layer covers it up.
//
// Grouped by process stage so the tour can render one stage at a time.
export function CutawayLayer() {
  const chambers = useSimStore((s) => s.chambers);
  return (
    <>
      {/* --- absorption: chambers A and B and everything that serves them */}
      <Section id={SECTION.ABSORPTION}>
        <group position={[0, LIFT, 0]}>
          <Vessel
            position={VESSEL_A_LOCAL}
            fillLevel={chambers.A.fill}
            color="#3a7ca5"
          />
          <Vessel
            position={VESSEL_B_LOCAL}
            fillLevel={chambers.B.fill}
            color="#c0863a"
          />
        </group>

        {/* one continuous run from the water column into chamber A, with a
            connector tapped off above chamber B */}
        <PipeRun points={gasMainRoute()} {...GAS_PIPE} showFlow={false} />
        <PipeRun points={gasBranchRoute()} {...GAS_PIPE} showFlow={false} />

        {/* gas starts only once the working chamber holds 80% solvent, and
            travels only toward that chamber */}
        <FlowDots
          points={gasFlowPath("A")}
          radius={GAS_PIPE.radius}
          color={GAS_PIPE.liquidColor}
          selector={(s) => isGasFlowing(s) && s.activeChamber === "A"}
        />
        <FlowDots
          points={gasFlowPath("B")}
          radius={GAS_PIPE.radius}
          color={GAS_PIPE.liquidColor}
          selector={(s) => isGasFlowing(s) && s.activeChamber === "B"}
        />

        <Bubbles vesselLocal={VESSEL_A_LOCAL} chamberId="A" />
        <Bubbles vesselLocal={VESSEL_B_LOCAL} chamberId="B" />

        {/* ball valves: A's on the header before its elbow, B's on its drop.
            Levers swing parallel to the pipe when flow passes, perpendicular
            when shut. */}
        <Valve
          position={GAS_A_VALVE_POS}
          radius={0.08}
          lever="y"
          openSelector={(s) => isGasFlowing(s) && s.activeChamber === "A"}
        />
        <Valve
          position={gasBranchValvePos(VESSEL_B_LOCAL)}
          radius={0.08}
          lever="x"
          openSelector={(s) => isGasFlowing(s) && s.activeChamber === "B"}
        />

        {/* open-ended gas outlet vents, releasing only from the working
            chamber */}
        <PipeRun
          points={ventRoute(VESSEL_A_LOCAL)}
          {...GAS_PIPE}
          flowCount={3}
          flowSelector={(s) => isGasFlowing(s) && s.activeChamber === "A"}
        />
        <PipeRun
          points={ventRoute(VESSEL_B_LOCAL)}
          {...GAS_PIPE}
          flowCount={3}
          flowSelector={(s) => isGasFlowing(s) && s.activeChamber === "B"}
        />

        <Sparger position={spargerPos(VESSEL_A_LOCAL)} />
        <Sparger position={spargerPos(VESSEL_B_LOCAL)} />

        {/* tee fitting where the connector taps off the main run above B */}
        <mesh position={BRANCH_TEE} renderOrder={2}>
          <sphereGeometry args={[GAS_PIPE.radius * 1.35, 16, 16]} />
          <meshStandardMaterial
            color={GAS_PIPE.color}
            metalness={0.3}
            roughness={0.2}
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </mesh>

        <Label position={[VESSEL_A_LOCAL[0], LIFT + 1.15, 0]} radius={1.3}>
          {"Absorption A"}
        </Label>
        <Label position={[VESSEL_B_LOCAL[0], LIFT + 1.15, 0]} radius={1.3}>
          {"Absorption B"}
        </Label>
      </Section>

      {/* --- conditioning: the water column, standing at grade under the
          deck rather than up on it */}
      <Section id={SECTION.COLUMN}>
        <Vessel
          position={[COLUMN_POSITION[0], COLUMN_CENTER_Y, COLUMN_POSITION[2]]}
          fillLevel={chambers.W.fill}
          color="#2a5d8f"
          height={WATER_HEIGHT}
          radius={COLUMN_RADIUS}
        />
        <Label
          position={[COLUMN_POSITION[0], COLUMN_BASE_Y + WATER_HEIGHT * 0.72, COLUMN_POSITION[2]]}
          radius={COLUMN_RADIUS + 0.1}
        >
          {"Water Column"}
        </Label>
        <ColumnBubbles />
        <PipeRun
          points={columnDrainRoute()}
          radius={0.11}
          color="#b0c8db"
          liquidColor="#2a5d8f"
          flowSelector={(s) => s.chambers.W.phase === "draining"}
        />
        <Valve
          position={columnDrainValvePos()}
          radius={0.11}
          lever="x"
          openSelector={(s) => s.chambers.W.phase === "draining"}
        />
        <Valve
          position={GAS_HEADER_VALVE_POS}
          radius={0.08}
          lever="y"
          openSelector={isGasFlowing}
        />
      </Section>

      {/* --- source: the supply line off the stack. The chimney itself is
          shared by both views — see Scene.jsx, and its plume with it: the
          stack is still emitting, whichever way the plant is being looked
          at. */}
      <Section id={SECTION.SOURCE}>
        <Label
          position={[CHIMNEY_X, CHIMNEY_TOP_Y - 7.5, 0]}
          radius={CHIMNEY_RADIUS + 0.15}
        >
          {"Flue Stack\n(gas source)"}
        </Label>
        <PipeRun
          points={gasSupplyRoute()}
          {...GAS_PIPE}
          flowSelector={isGasFlowing}
        />
      </Section>

      {/* --- air capture: the roof fans and the header they push down into
          the water column, alongside the flue line rather than merged with
          it. Either source can run without the other. */}
      <Section id={SECTION.DAC}>
        <PipeRun
          points={dacDuctRoute()}
          radius={0.13}
          color="#d6e2ee"
          liquidColor="#cfe6f2"
          flowCount={8}
          flowSelector={(st) => st.dacRunning}
        />
        <Label
          position={[DAC_POSITION[0], DAC_TOP_Y + 0.9, DAC_POSITION[2]]}
          radius={1.9}
          fontSize={0.24}
        >
          {"Air Capture Fans"}
        </Label>
      </Section>

      {/* --- recovery: the buffer tank and the chamber drains feeding it.
          Both drain endpoints are already in world space, so these are
          siblings of the lifted group — applying LIFT again would be wrong.
          The drains merge at one junction after the valves and share a
          single drop, so B's run draws it and A's stops at the junction. */}
      <Section id={SECTION.STORAGE}>
        <Label position={[BASE_POSITION[0], GRADE_SKIRT + GRADE_HEIGHT * 0.74, 0]} radius={GRADE_RADIUS + 0.1}>
          {"Storage Tank"}
        </Label>
        <StorageTank
          position={[BASE_POSITION[0], GRADE_SKIRT, BASE_POSITION[2]]}
          height={GRADE_HEIGHT}
          radius={GRADE_RADIUS}
        />
        {/* a slight tint of each chamber's own liquid on the pipe wall
            itself, so which drain belongs to which chamber reads even when
            nothing is flowing through it */}
        <PipeRun
          points={drainRoute(VESSEL_A_LOCAL).slice(0, -1)}
          color="#bcd6e3"
          showFlow={false}
        />
        <PipeRun
          points={drainRoute(VESSEL_B_LOCAL)}
          color="#e8cea3"
          showFlow={false}
        />
        <FlowDots
          points={drainRoute(VESSEL_A_LOCAL)}
          radius={0.12}
          color="#3a7ca5"
          selector={(s) => s.chambers.A.phase === "draining"}
        />
        <FlowDots
          points={drainRoute(VESSEL_B_LOCAL)}
          radius={0.12}
          color="#c0863a"
          selector={(s) => s.chambers.B.phase === "draining"}
        />
        <Valve
          position={drainValvePos(VESSEL_A_LOCAL)}
          radius={0.12}
          lever="x"
          openSelector={(s) => s.chambers.A.phase === "draining"}
        />
        <Valve
          position={drainValvePos(VESSEL_B_LOCAL)}
          radius={0.12}
          lever="x"
          openSelector={(s) => s.chambers.B.phase === "draining"}
        />
      </Section>

      {/* --- decomposition: the stirred vessel and its transfer line */}
      <Section id={SECTION.DECOMPOSITION}>
        <Label position={[DECOMP_POSITION[0], GRADE_SKIRT + GRADE_HEIGHT * 0.74, 0]} radius={GRADE_RADIUS + 0.1}>
          {"Decomposition"}
        </Label>
        <BaseUnit
          position={[DECOMP_POSITION[0], GRADE_SKIRT, DECOMP_POSITION[2]]}
          height={GRADE_HEIGHT}
          radius={GRADE_RADIUS}
        />
        <PipeRun
          points={storageTransferRoute()}
          color="#b9c8d4"
          liquidColor="#4a6d8c"
          flowSelector={(s) => s.storageDraining}
        />
        <Valve
          position={TRANSFER_VALVE_POS}
          radius={0.12}
          lever="y"
          openSelector={(s) => s.storageDraining}
        />
      </Section>

      {/* --- filtration: what leaves decomposition is split here. Graphite
          drops out to the collection bin; the recovered solvent goes back
          to the storage tank, which is what closes the loop. */}
      <Section id={SECTION.FILTRATION}>
        <Label
          position={[FILTRATION_POSITION[0], GRADE_SKIRT + GRADE_HEIGHT * 0.74, 0]}
          radius={GRADE_RADIUS + 0.1}
        >
          {"Filtration System"}
        </Label>
        <StorageTank
          position={[FILTRATION_POSITION[0], GRADE_SKIRT, FILTRATION_POSITION[2]]}
          height={GRADE_HEIGHT}
          radius={GRADE_RADIUS}
          fillSelector={(s) => s.filtrationFill}
          liquidColor="#7a9a4a"
          errorKeyword="Filtration"
        />
        <PipeRun
          points={decompTransferRoute()}
          color="#cdeaf7"
          liquidColor="#5bb8e0"
          flowSelector={(s) => s.decompDraining}
        />
        <Valve
          position={DECOMP_TRANSFER_VALVE_POS}
          radius={0.12}
          lever="y"
          openSelector={(s) => s.decompDraining}
        />

        {/* graphite out one side */}
        <PipeRun
          points={graphiteChuteRoute()}
          radius={0.14}
          liquidColor="#2f333a"
          flowSelector={(s) => s.filtrationRunning}
        />
        <GraphiteBin />
        <Label
          position={[GRAPHITE_BIN_POSITION[0], 1.4, GRAPHITE_BIN_POSITION[2]]}
          radius={0.7}
          fontSize={0.22}
        >
          {"Graphite"}
        </Label>

        {/* spent solvent out the other side: into the treatment chamber,
            and from there on to the inventory tank the chambers draw from */}
        {/* filtration's own colour: this is what just left it, not what
            the treatment chamber already holds */}
        <PipeRun
          points={solventReturnRoute()}
          color="#dbe6c8"
          liquidColor="#7a9a4a"
          flowSelector={(s) => s.filtrationRunning}
        />
        <Valve
          position={SOLVENT_RETURN_VALVE_POS}
          radius={0.12}
          yaw={Math.PI / 2}
          openSelector={(s) => s.filtrationRunning}
        />
      </Section>

      {/* --- treatment: what the filter hands over is spent, and is
          conditioned here before it can be charged back into a chamber */}
      <Section id={SECTION.TREATMENT}>
        <StorageTank
          position={[TREATMENT_POSITION[0], GRADE_SKIRT, TREATMENT_POSITION[2]]}
          height={GRADE_HEIGHT}
          radius={GRADE_RADIUS}
          fillSelector={(s) => s.treatmentFill}
          liquidColor="#2fae94"
          errorKeyword="Treatment"
        />
        <Label
          position={[
            TREATMENT_POSITION[0],
            GRADE_SKIRT + GRADE_HEIGHT * 0.74,
            TREATMENT_POSITION[2],
          ]}
          radius={GRADE_RADIUS + 0.1}
          fontSize={0.24}
        >
          {"Spent Solvent\nTreatment Chamber"}
        </Label>
        {/* treatment's own colour: the inventory tank picks up its own
            shade only once this actually lands in it */}
        <PipeRun
          points={inventoryChargeRoute()}
          radius={0.1}
          color="#c8ece4"
          liquidColor="#2fae94"
          flowSelector={(s) => s.treatmentDraining}
        />
        <Valve
          position={INVENTORY_CHARGE_VALVE_POS}
          radius={0.1}
          openSelector={(s) => s.treatmentDraining}
        />
      </Section>

      {/* --- inventory: the only vessel the chambers are charged from */}
      <Section id={SECTION.INVENTORY}>
        {/* the inventory tank, and the feed out of its base up to the
            chambers — the only route fresh solvent reaches them by */}
        <StorageTank
          position={[
            INVENTORY_POSITION[0],
            GRADE_SKIRT,
            INVENTORY_POSITION[2],
          ]}
          height={GRADE_HEIGHT}
          radius={GRADE_RADIUS}
          fillSelector={(s) => s.inventoryFill}
          liquidColor="#8fd0bb"
          errorKeyword="Inventory"
        />
        <Label
          position={[
            INVENTORY_POSITION[0],
            GRADE_SKIRT + GRADE_HEIGHT * 0.74,
            INVENTORY_POSITION[2],
          ]}
          radius={GRADE_RADIUS + 0.1}
        >
          {"Solvent Inventory"}
        </Label>
        {/* the pipe geometry is static; which chamber it's actually
            carrying solvent to is shown by the two FlowDots below, exactly
            as the gas circuit shows it */}
        <PipeRun
          points={solventFeedRoute()}
          radius={0.1}
          color="#dbf0e4"
          showFlow={false}
        />
        <PipeRun
          points={solventFeedBranchRoute()}
          radius={0.1}
          color="#dbf0e4"
          showFlow={false}
        />
        <FlowDots
          points={solventFlowPath("A")}
          radius={0.1}
          color="#8fd0bb"
          selector={(s) => s.chambers.A.phase === "filling"}
        />
        <FlowDots
          points={solventFlowPath("B")}
          radius={0.1}
          color="#8fd0bb"
          selector={(s) => s.chambers.B.phase === "filling"}
        />
        <Valve
          position={SOLVENT_FEED_VALVE_POS}
          radius={0.1}
          yaw={Math.PI / 2}
          openSelector={(s) => s.solventFeeding}
        />
        {/* one valve on the header, past the tee to B — closes off A alone.
            B has no valve of its own here: it sits right at the tee, and a
            second ball valve that close to the branch above an already-drawn
            tee fitting doubled up on the same junction rather than reading
            as two separate isolation points. */}
        <Valve
          position={SOLVENT_A_VALVE_POS}
          radius={0.08}
          lever="y"
          openSelector={(s) => s.chambers.A.phase === "filling"}
        />
        <mesh position={solventFeedTee()} renderOrder={2}>
          <sphereGeometry args={[0.14, 14, 14]} />
          <meshStandardMaterial
            color="#cbd8e6"
            metalness={0.3}
            roughness={0.2}
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </mesh>
      </Section>

    </>
  );
}
