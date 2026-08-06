// Single source of truth for every shared position/size in the scene.
// Nothing outside this file should hardcode these numbers — if a value
// (a height, an offset, a radius) is used in more than one place, it lives
// here and gets imported, never retyped.

import { VESSEL_HEIGHT, VESSEL_RADIUS } from "./components/Vessel.jsx";

export const BASE_HEIGHT = 3; // height of the BaseUnit housing
export const LIFT = BASE_HEIGHT + VESSEL_HEIGHT + 2; // world Y offset of the vessel group
export const WATER_HEIGHT = 3.2; // the water column's shell height
export const BASE_RADIUS_MULTIPLIER = 1.6; // housing is wider than a single vessel
export const BASE_RADIUS = VESSEL_RADIUS * BASE_RADIUS_MULTIPLIER;

// Gap between a vessel's process wall and its exterior cladding. Declared up
// here rather than with the rest of the exterior constants because the
// pipe routes below need it at module-evaluation time: a nozzle lands on the
// cladding, which is the surface you actually see.
export const SHELL_GAP = 0.14;

// Vessel positions, local to the lifted group (world space = add [0, LIFT, 0])
export const VESSEL_A_LOCAL = [-1.5, 0, 0];
export const VESSEL_B_LOCAL = [1.5, 0, 0];

// The water column stands at grade, under the access deck, rather than up
// on it beside the chambers. It only has to hand gas onward, and gas is
// trivial to carry upward — so there is no reason to lift the vessel, its
// water, and the steelwork to hold them four metres into the air.
export const COLUMN_RADIUS = 1.1;
export const COLUMN_POSITION = [4.5, 0, 0];
// Raised on a short support so the column can empty itself out of the
// bottom under gravity, and is refilled from an external line into the top.
export const COLUMN_BASE_Y = 1.6;
export const COLUMN_FLOOR_Y = COLUMN_BASE_Y;
export const COLUMN_CENTER_Y = COLUMN_BASE_Y + WATER_HEIGHT / 2;
export const COLUMN_TOP_Y = COLUMN_BASE_Y + WATER_HEIGHT;

// Bottom drain: out of the column floor, down, and away to the pit
export function columnDrainRoute() {
  const [cx, , cz] = COLUMN_POSITION;
  return [
    [cx, COLUMN_FLOOR_Y, cz],
    [cx, 0.3, cz],
    [cx - 1.7, 0.3, cz],
  ];
}

export function columnDrainValvePos() {
  return [COLUMN_POSITION[0], 0.85, COLUMN_POSITION[2]];
}

// Storage tank sits at the world origin, grounded, directly under A/B
export const BASE_POSITION = [0, 0, 0];

// Decomposition chamber (motor + fan) stands to the left of the storage
// tank, away from the chimney/water column side, and takes a single low
// transfer line from it
export const DECOMP_HEIGHT = BASE_HEIGHT * 0.9;
export const DECOMP_RADIUS = BASE_RADIUS * 0.9;
export const DECOMP_POSITION = [-5, 0, 0];

// Where a run offset to z = `z` crosses the wall of a cylinder of radius
// `radius`. Transfer lines are pushed off the centreline so they stop
// crossing the nameplates on the front of each vessel, and without this the
// pipe ends would hang in mid-air short of (or inside) the shell.
export function wallX(centerX, radius, z, side) {
  // The exterior shell is the surface you actually see, so a line has to
  // reach that, not the process radius inside it. Reaching only the inner
  // radius left every low transfer line hanging clear of the tank it was
  // supposed to be plumbed into.
  const outer = radius + SHELL_GAP;
  const half = Math.sqrt(Math.max(0.01, outer * outer - z * z));
  // overlap slightly so the pipe end is buried in the wall, never floating
  // a hair short of it
  return centerX + side * (half - 0.12);
}

// Transfer lines sit behind the vessels, clear of the nameplate faces, and
// low enough to read as bottom connections rather than pipes crossing the
// tank walls halfway up.
export const TRANSFER_Z = -0.85;
export const TRANSFER_Y = 0.5;

// Low horizontal transfer line: storage tank wall -> decomposition wall
export function storageTransferRoute() {
  return [
    [wallX(BASE_POSITION[0], BASE_RADIUS, TRANSFER_Z, -1), TRANSFER_Y, TRANSFER_Z],
    [wallX(DECOMP_POSITION[0], DECOMP_RADIUS, TRANSFER_Z, 1), TRANSFER_Y, TRANSFER_Z],
  ];
}

// Ball valve on the transfer line, close to the storage tank
export const TRANSFER_VALVE_POS = [-(BASE_RADIUS + 0.5), TRANSFER_Y, TRANSFER_Z];

// ---- filtration -----------------------------------------------------------
// Last stage in the loop: what leaves the decomposition chamber is split
// here into solid graphite on one side and clean solvent on the other, and
// the solvent goes back to the storage tank to be used again.
export const FILTRATION_HEIGHT = 2.6;
export const FILTRATION_RADIUS = 1.45;
export const FILTRATION_POSITION = [-9.8, 0, 0];

// Graphite discharge: a chute off the filter base into a collection bin
export const GRAPHITE_BIN_POSITION = [
  FILTRATION_POSITION[0],
  0,
  FILTRATION_POSITION[2] + FILTRATION_RADIUS + 1.5,
];

// Decomposition -> filtration transfer line
export function decompTransferRoute() {
  return [
    [wallX(DECOMP_POSITION[0], DECOMP_RADIUS, TRANSFER_Z, -1), TRANSFER_Y, TRANSFER_Z],
    [wallX(FILTRATION_POSITION[0], FILTRATION_RADIUS, TRANSFER_Z, 1), TRANSFER_Y, TRANSFER_Z],
  ];
}

export const DECOMP_TRANSFER_VALVE_POS = [
  DECOMP_POSITION[0] - DECOMP_RADIUS - 0.5,
  TRANSFER_Y,
  TRANSFER_Z,
];

// Graphite chute: filter base -> collection bin
export function graphiteChuteRoute() {
  const [fx, , fz] = FILTRATION_POSITION;
  return [
    [fx, 1.0, fz + FILTRATION_RADIUS - 0.1],
    [fx, 1.0, GRAPHITE_BIN_POSITION[2]],
    [fx, 0.62, GRAPHITE_BIN_POSITION[2]],
  ];
}

// Recovered solvent does not go back to the loaded-solvent storage tank —
// it is clean, and mixing it back into the loaded stream would undo the
// separation. It gets its own tank beside the filter, and the chambers draw
// their fresh charge from there.
export const RECOVERED_HEIGHT = 2.4;
export const RECOVERED_RADIUS = 1.05;
// Sits directly behind the two absorption chambers, centred between them.
// It used to stand at the far end of the tank row, which meant its feed had
// to cross the entire plot before it could split — one long pipe threading
// past everything else. From here a single riser goes up and tees straight
// into both chambers.
export const RECOVERED_POSITION = [0, 0, -4.9];

// Filter -> recovered solvent tank: the next link in the same low run of
// transfer lines, on the same offset behind the vessels as the rest
export function solventReturnRoute() {
  const [fx, , fz] = FILTRATION_POSITION;
  const [rx, , rz] = RECOVERED_POSITION;
  return [
    [fx, TRANSFER_Y, fz - (FILTRATION_RADIUS + SHELL_GAP - 0.12)],
    [fx, TRANSFER_Y, rz],
    [rx - (RECOVERED_RADIUS + SHELL_GAP - 0.12), TRANSFER_Y, rz],
  ];
}

// Isolation valve where the return line leaves the filter. It sits on the
// first (Z-running) leg, so it needs a quarter turn to face the right way.
export const SOLVENT_RETURN_VALVE_POS = [
  FILTRATION_POSITION[0],
  TRANSFER_Y,
  FILTRATION_POSITION[2] - (FILTRATION_RADIUS + SHELL_GAP) - 0.5,
];

// Fresh solvent from the recovered tank up to the two chambers.
//
// This run is kept deliberately alone. It leaves the tank through a nozzle
// on the shell rather than out of the middle of the domed head — a line
// sprouting from the centre of a tank lid reads as a mistake, and a side
// nozzle with an isolation valve right at it is how a tank you actually
// have to shut off is plumbed.
//
// From there it is on its own offset in Z for its whole length and drops
// into each chamber through its own penetration, so it never shares a
// position with the gas header or the vents. Nothing about this line should
// be ambiguous when you look at the top of the plant.
export const SOLVENT_FEED_Z = -0.72; // clear of the gas circuit, which is at z = 0

// Depth the feed leg reaches inside a chamber: below the rim, well clear of
// the working liquid level, so fresh solvent is delivered into the vessel
// rather than dribbled onto its lid.
const FEED_DIP_Y = LIFT + VESSEL_HEIGHT / 2 - 1.35;

// Side nozzle on the recovered tank, and the riser standing just off it
const FEED_NOZZLE_Y = RECOVERED_HEIGHT * 0.66;
const FEED_NOZZLE_X =
  RECOVERED_POSITION[0] + RECOVERED_RADIUS + SHELL_GAP - 0.12;
const FEED_RISER_X = RECOVERED_POSITION[0] + RECOVERED_RADIUS + SHELL_GAP + 0.5;

export function solventFeedRoute() {
  const [, , rz] = RECOVERED_POSITION;
  const [ax] = VESSEL_A_LOCAL;
  return [
    [FEED_NOZZLE_X, FEED_NOZZLE_Y, rz], // out of the tank wall
    [FEED_RISER_X, FEED_NOZZLE_Y, rz], // short spur to the riser
    [FEED_RISER_X, SOLVENT_HEADER_Y, rz], // up
    [FEED_RISER_X, SOLVENT_HEADER_Y, SOLVENT_FEED_Z], // in toward the chambers
    [ax, SOLVENT_HEADER_Y, SOLVENT_FEED_Z], // along the header, over B, to A
    [ax, FEED_DIP_Y, SOLVENT_FEED_Z], // down into A
  ];
}

// Isolation valve on the spur, right at the tank — "at the start" of the line
export const SOLVENT_FEED_VALVE_POS = [
  FEED_NOZZLE_X + 0.32,
  FEED_NOZZLE_Y,
  RECOVERED_POSITION[2],
];

// The header passes directly over chamber B on its way to A, so that is
// where the branch tees off — the same arrangement as the gas circuit.
export function solventFeedTee() {
  return [VESSEL_B_LOCAL[0], SOLVENT_HEADER_Y, SOLVENT_FEED_Z];
}

// The other half of the split: same tee, straight down into chamber B.
export function solventFeedBranchRoute() {
  const [bx] = VESSEL_B_LOCAL;
  return [solventFeedTee(), [bx, FEED_DIP_Y, SOLVENT_FEED_Z]];
}

// World-space position of a vessel's floor outlet (bottom-center of the tank)
export function vesselOutletWorld(localPos, vesselHeight = VESSEL_HEIGHT) {
  const [x, y, z] = localPos;
  return [x, LIFT + y - vesselHeight / 2, z];
}

// World-space position of an inlet nub on top of the base housing
export function baseInletWorld(xOffset) {
  const [bx, by, bz] = BASE_POSITION;
  return [bx + xOffset, by + BASE_HEIGHT, bz];
}

// Height of the horizontal cross-run between a vessel and the base housing,
// midway through the air gap so both elbows stay clear of the geometry.
const PIPE_RUN_Y = BASE_HEIGHT + 1;

// ---- Gas circuit -----------------------------------------------------------

const VESSEL_TOP_Y = LIFT + VESSEL_HEIGHT / 2; // world Y of A/B/W rims (all equal)

// Grounded cylindrical chimney beyond the water column — the gas source.
// Smoke escapes its open top; the supply line taps off just below the rim.
export const CHIMNEY_X = 8.5;
export const CHIMNEY_RADIUS = 0.55;
export const CHIMNEY_TOP_Y = VESSEL_TOP_Y + 0.3;

const GAS_OUT_HEADER_Y = VESSEL_TOP_Y + 1.8; // water column -> chambers run
// Fresh-solvent feed header. Just above the chamber rims — it only has to
// clear the vessels it feeds, not the gas header, because the two run on
// opposite sides of the chambers in Z.
const SOLVENT_HEADER_Y = VESSEL_TOP_Y + 0.8;

const DIP_OFFSET = 0.4; // keep the two tubes entering W apart

// Tee directly above chamber B, where the branch taps off the main W->A run
export const BRANCH_TEE = [
  VESSEL_B_LOCAL[0],
  GAS_OUT_HEADER_Y,
  VESSEL_B_LOCAL[2],
];

// Chimney base tap -> riser alongside the stack -> across -> down into the
// water column, ending below the water surface. Tapping low means the line
// draws flue gas before it escapes out the top.
export function gasSupplyRoute() {
  const [cx, , cz] = COLUMN_POSITION;
  const dipY = COLUMN_FLOOR_Y + 0.45; // near the column floor
  const riserX = CHIMNEY_X - 1.2;
  const headerY = WATER_HEIGHT + 1.4; // clears the column, stays under the deck
  return [
    [CHIMNEY_X, 0.9, 0],
    [riserX, 0.9, 0],
    [riserX, headerY, 0],
    [cx + DIP_OFFSET, headerY, cz],
    [cx + DIP_OFFSET, dipY, cz],
  ];
}

// Height of the sparger disc, just above each chamber's floor
export const SPARGER_Y = LIFT - VESSEL_HEIGHT / 2 + 0.35;

// Single continuous run: straight up out of the water column head, across
// the header (passing over B), then down into chamber A, ending open just
// above its sparger disc.
//
// The riser used to dodge sideways out from under the deck before climbing.
// That was an elbow for no reason — gas rises, and a riser passing through
// a walkway is ordinary; the deck simply gets a penetration collar where it
// goes through.
export function gasMainRoute() {
  const [cx, , cz] = COLUMN_POSITION;
  const [ax, , az] = VESSEL_A_LOCAL;
  // Off the top head itself, not from a point floating below it
  const headY = COLUMN_TOP_Y;
  return [
    [cx, headY, cz],
    [cx, GAS_OUT_HEADER_Y, cz],
    [ax, GAS_OUT_HEADER_Y, az],
    [ax, SPARGER_Y, az],
  ];
}

// Where the gas riser passes through the deck plate
export function deckPenetration() {
  return [COLUMN_POSITION[0], 0, COLUMN_POSITION[2]];
}

// Connector tapped off the main run directly above chamber B: a straight
// drop connecting into B's sparger hub.
export function gasBranchRoute() {
  const [bx, , bz] = VESSEL_B_LOCAL;
  return [BRANCH_TEE, [bx, SPARGER_Y, bz]];
}

// Path the gas actually takes, depending on which chamber is active: the
// full main run into A, or the shared run up to the tee above B and then
// down into it. Built from the main route so the two can never disagree.
export function gasFlowPath(chamber) {
  const main = gasMainRoute();
  if (chamber === "A") return main;
  const [bx, , bz] = VESSEL_B_LOCAL;
  // every point up to (but not including) the final cross-over into A,
  // then the tee above B and the drop
  return [...main.slice(0, -2), BRANCH_TEE, [bx, SPARGER_Y, bz]];
}

// World position of a chamber's sparger hub (end of the branch drop pipe)
export function spargerPos(vesselLocal) {
  const [vx, , vz] = vesselLocal;
  return [vx, SPARGER_Y, vz];
}

// Valve positions along the gas circuit (all on straight segments)
export function gasBranchValvePos(vesselLocal) {
  const [vx, , vz] = vesselLocal; // on the vertical drop, above the rim
  return [vx, VESSEL_TOP_Y + 0.9, vz];
}
// Chamber A's gas valve sits on the header right next to the tee junction
export const GAS_A_VALVE_POS = [0.9, GAS_OUT_HEADER_Y, 0];
// On the outlet header, just after the water column's elbow
export const GAS_HEADER_VALVE_POS = [3.6, GAS_OUT_HEADER_Y, 0];

// L-shaped gas outlet vent on a chamber: short riser just inside the rim,
// then a horizontal open-ended stub pointing away from the chamber center
export function ventRoute(vesselLocal) {
  const [vx, , vz] = vesselLocal;
  const dir = Math.sign(vx) || 1;
  const x = vx + 0.55 * dir;
  return [
    [x, VESSEL_TOP_Y - 0.3, vz],
    [x, VESSEL_TOP_Y + 0.7, vz],
    [x + 0.8 * dir, VESSEL_TOP_Y + 0.7, vz],
  ];
}

// Ball valve on the liquid drain pipe below a chamber, kept close to the
// chamber base so the pipe above the valve holds no dead volume
export function drainValvePos(vesselLocal) {
  const [vx, , vz] = vesselLocal;
  const outletY = LIFT - VESSEL_HEIGHT / 2;
  return [vx, outletY - 0.55, vz];
}

// Both chamber drains merge at a single junction after their valves, and one
// shared pipe drops into the decomposition chamber. Offset from center so the
// down pipe clears the motor on top of the housing.
export const DRAIN_JUNCTION_X = 0.6;

// ---- Exterior layer --------------------------------------------------------
//
// The real-world skin wraps the same coordinates the schematic uses. Every
// number below is derived from the values above, so the shell of a vessel
// is always concentric with the glass inside it — if it weren't, the
// cutaway toggle would look like a glitch instead of a reveal.

// Cladding sits just outside the process wall (SHELL_GAP is declared at the
// top of the file — the pipe routes need it before this point)
export const SHELL_RADIUS = VESSEL_RADIUS + SHELL_GAP;
export const STORAGE_SHELL_RADIUS = BASE_RADIUS + SHELL_GAP;
export const DECOMP_SHELL_RADIUS = DECOMP_RADIUS + SHELL_GAP;

// Depth of the dished head capping each end of a vessel, as a fraction of
// its radius. 0.42 is close to a standard 2:1 elliptical head.
export const HEAD_RATIO = 0.42;

// Elevated steel structure carrying chambers A, B and the water column.
// The deck sits just below the vessels' bottom heads.
export const DECK_Y = LIFT - VESSEL_HEIGHT / 2 - SHELL_RADIUS * HEAD_RATIO - 0.35;
export const DECK_X = [-3.35, 6.75]; // deck extent in X
export const DECK_Z = [-2.0, 2.0]; // deck extent in Z
export const DECK_THICKNESS = 0.16;

// Support columns, placed to clear the storage tank and decomposition
// chamber standing underneath the deck
export const COLUMN_X = [DECK_X[0] + 0.35, 2.35, DECK_X[1] - 0.35];
export const COLUMN_Z = [DECK_Z[0] + 0.3, DECK_Z[1] - 0.3];
export const COLUMN_SIZE = 0.26;

// Handrail geometry, shared by the deck edge and the ladder cage
export const RAIL_HEIGHT = 1.1;
export const RAIL_RADIUS = 0.045;
export const KICKPLATE_HEIGHT = 0.16;

// Access ladder up to the deck, on the far (-Z) side away from the camera's
// default framing so it never blocks the process view. It sits right
// against the deck edge — standing it off looked like a separate object
// floating near the plant rather than part of it.
export const LADDER_X = 3.9;
export const LADDER_Z = DECK_Z[0] - 0.14;
export const LADDER_WIDTH = 0.62;

// Footprints the under-deck bracing has to keep clear of, as [minX, maxX].
// The X braces used to run straight through the storage tank.
export function underDeckObstacles() {
  return [
    [BASE_POSITION[0] - BASE_RADIUS, BASE_POSITION[0] + BASE_RADIUS],
    [DECOMP_POSITION[0] - DECOMP_RADIUS, DECOMP_POSITION[0] + DECOMP_RADIUS],
  ];
}

// Ground pad the whole plant stands on
// Wide enough that its edge stays out of frame at every camera angle the
// orbit controls allow — a visible circular rim reads as a turntable.
export const PAD_CENTER = [1, 0, 0];
export const PAD_RADIUS = 26;

// Full drain path from a chamber's floor outlet to the decomposition chamber:
// straight drop, horizontal run to the junction, shared drop into the inlet.
export function drainRoute(vesselLocal) {
  const [ox, oy, oz] = vesselOutletWorld(vesselLocal);
  const [ix, iy, iz] = baseInletWorld(DRAIN_JUNCTION_X);
  return [
    [ox, oy, oz],
    [ox, PIPE_RUN_Y, oz],
    [ix, PIPE_RUN_Y, iz],
    [ix, iy, iz],
  ];
}
