// Single source of truth for every shared position/size in the scene.
// Nothing outside this file should hardcode these numbers — if a value
// (a height, an offset, a radius) is used in more than one place, it lives
// here and gets imported, never retyped.
//
// ---- the plan ---------------------------------------------------------------
//
// The unit is containerised: everything but the flue stack lives inside one
// rectangular housing, so the footprint has to be a container's — long, half
// as wide, and no taller than it is wide by much. That single constraint is
// what shapes the whole arrangement below.
//
// It is laid out as a U, on two lanes running the length of the box:
//
//   lane A (z = 0)        gas in at the +X end -> water column and the two
//                         absorption chambers on the elevated deck, with the
//                         storage tank under them, then decomposition and
//                         filtration continuing at grade toward -X
//   lane B (z = LANE_B_Z) the return leg: spent solvent treatment, opposite
//                         the filter it is fed from, and then a long low run
//                         back up an otherwise empty aisle
//   back under the deck   the solvent inventory tank, in the bay at the far
//                         end of the deck, directly below the chambers it
//                         charges
//
// Stacking the deck over lane A is what makes it fit: the chambers and the
// column above, the storage and inventory tanks below, all sharing the same
// ground area at different heights. Only what cannot be stacked — the two
// vessels with a motor and a filter press on them, and the treatment tank —
// stands out in the open.

import { VESSEL_HEIGHT, VESSEL_RADIUS } from "./components/Vessel.jsx";

// Gap between a vessel's process wall and its exterior cladding. Declared up
// here rather than with the rest of the exterior constants because the
// pipe routes below need it at module-evaluation time: a nozzle lands on the
// cladding, which is the surface you actually see.
export const SHELL_GAP = 0.14;

// Depth of the dished head capping each end of a vessel, as a fraction of
// its radius. 0.42 is close to a standard 2:1 elliptical head.
export const HEAD_RATIO = 0.42;

// Cladding sits just outside the process wall
export const SHELL_RADIUS = VESSEL_RADIUS + SHELL_GAP;

// ---- grade vessels ----------------------------------------------------------
// One size for every tank standing on the floor. They do different jobs, but
// they are the same vessel: a plant that buys five different shells to hold
// five similar batches is a plant nobody costed. Making them identical also
// lets the whole ground row sit on one pitch, which is most of why the
// arrangement reads as tidy rather than as five tanks that happen to be near
// each other.
export const BASE_HEIGHT = 3; // height of every grade tank
export const BASE_RADIUS_MULTIPLIER = 1.6; // wider than a single chamber
export const BASE_RADIUS = VESSEL_RADIUS * BASE_RADIUS_MULTIPLIER;
export const GRADE_HEIGHT = BASE_HEIGHT;
export const GRADE_RADIUS = BASE_RADIUS;
export const GRADE_SHELL_RADIUS = GRADE_RADIUS + SHELL_GAP;

// Every grade tank stands on a skirt, and every one of them empties out of
// its own floor. A nozzle in the side of a tank leaves whatever sits below it
// behind — dead volume that never moves, on a plant whose entire job is to
// keep passing one batch of solvent along. Lifting the shells costs a metre
// of height and removes the problem outright.
export const GRADE_SKIRT = 0.95;
export const GRADE_FLOOR_Y = GRADE_SKIRT;
export const GRADE_CENTER_Y = GRADE_SKIRT + GRADE_HEIGHT / 2;
// Where a transfer line entering from above lands, inside the top head
export const GRADE_INLET_Y = GRADE_SKIRT + GRADE_HEIGHT - 0.15;
const GRADE_TOP_Y = GRADE_SKIRT + GRADE_HEIGHT + GRADE_SHELL_RADIUS * HEAD_RATIO;

// Centre-to-centre pitch of the ground row. One diameter plus enough of a
// gap to run a transfer line and stand a valve in.
const TANK_PITCH = 5.4;

// The two lanes. Lane A is the process lane and is at z = 0, which keeps the
// gas circuit, the chamber drains and the deck all on the centreline they
// were always on.
export const LANE_B_Z = 5.6;

export const WATER_HEIGHT = 3.2; // the water column's shell height

// ---- the elevated deck ------------------------------------------------------
// Set directly rather than derived from the vessels above it, because what
// fixes it is what stands underneath: a grade tank plus its top head plus
// headroom to walk a transfer line across. Everything on the deck then hangs
// off this number.
export const DECK_Y = GRADE_TOP_Y + 1.1;
export const DECK_THICKNESS = 0.16;

// World Y of the lifted vessel group: high enough that a chamber's bottom
// head clears the deck plate it stands on.
export const LIFT =
  DECK_Y + 0.35 + SHELL_RADIUS * HEAD_RATIO + VESSEL_HEIGHT / 2;

// Vessel positions, local to the lifted group (world space = add [0, LIFT, 0])
export const VESSEL_A_LOCAL = [-1.5, 0, 0];
export const VESSEL_B_LOCAL = [1.5, 0, 0];

// The water column stands on the deck beside the chambers rather than at
// grade under it. Gas is trivial to carry upward, so lifting the column used
// to look like wasted steel — but the ground row is now full, and the deck
// has the space. Putting it up there is what freed the floor for the fifth
// tank without making the box any longer.
export const COLUMN_RADIUS = 1.1;
export const COLUMN_POSITION = [4.8, 0, 0];
// Short skirt on the deck, so it can still empty itself out of the bottom
// under gravity and be refilled from a line into the top.
export const COLUMN_SKIRT = 0.9;
export const COLUMN_BASE_Y = DECK_Y + COLUMN_SKIRT;
export const COLUMN_FLOOR_Y = COLUMN_BASE_Y;
export const COLUMN_CENTER_Y = COLUMN_BASE_Y + WATER_HEIGHT / 2;
export const COLUMN_TOP_Y = COLUMN_BASE_Y + WATER_HEIGHT;

// It is only spent wash water, so this is a drain and nothing more: through
// the deck, a short run out to the back of the box, and an open end over a
// floor gully. It is kept deliberately short and taken out on the -Z side —
// the inventory tank stands directly below the column, and its charge line
// comes in over the top from +Z, so this is the one direction left.
const COLUMN_DRAIN_Z = -2.05;

export function columnDrainRoute() {
  const [cx, , cz] = COLUMN_POSITION;
  const underDeck = DECK_Y - 0.8;
  return [
    [cx, COLUMN_FLOOR_Y, cz],
    [cx, underDeck, cz],
    [cx, underDeck, COLUMN_DRAIN_Z],
  ];
}

// At the very start of the drop, immediately under the column floor, where
// there is nothing above it to strand
export function columnDrainValvePos() {
  return [COLUMN_POSITION[0], COLUMN_FLOOR_Y - 0.45, COLUMN_POSITION[2]];
}

// ---- the ground row ---------------------------------------------------------
// Lane A, running away from the gas end: the storage tank sits under the
// chambers that drain into it, and the batch moves on toward -X.
export const BASE_POSITION = [0, 0, 0];
export const DECOMP_HEIGHT = GRADE_HEIGHT;
export const DECOMP_RADIUS = GRADE_RADIUS;
export const DECOMP_POSITION = [-TANK_PITCH, 0, 0];
export const FILTRATION_HEIGHT = GRADE_HEIGHT;
export const FILTRATION_RADIUS = GRADE_RADIUS;
export const FILTRATION_POSITION = [-2 * TANK_PITCH, 0, 0];

// Height the low transfer runs sit at, under the tank floors, and the height
// a line crosses at on its way over a tank's top head.
export const TRANSFER_RUN_Y = 0.42;
const TRANSFER_CROSS_Y = GRADE_TOP_Y + 0.4;

// A transfer between two grade tanks: out of the source tank's floor, down to
// the low run, along to a riser standing in the gap between the two shells,
// up and over, and down into the receiving tank's top head. Every one of them
// is the same shape, which is the point — one pattern repeated is what makes
// a pipe rack read as designed rather than improvised.
//
// The riser sits in the gap on whichever axis the two tanks are separated
// along, so it never has to climb through a shell.
// How far off a tank's centreline an incoming line lands, as a fraction of
// the radius. A pipe dropping into the middle of a tank head reads as a
// mistake anywhere; on the decomposition chamber it was worse than that,
// because the middle of that head is where the stirrer motor stands and the
// line went straight through it.
const INLET_OFFSET = 0.6;

export function gradeTransferRoute(from, to) {
  const [fx, , fz] = from;
  const [tx, , tz] = to;
  const alongX = Math.abs(tx - fx) > Math.abs(tz - fz);
  const riser = alongX ? [(fx + tx) / 2, fz] : [fx, (fz + tz) / 2];
  // land on the shoulder nearest the riser, so the crossover is short too
  const reach = GRADE_RADIUS * INLET_OFFSET;
  const entry = alongX
    ? [tx + Math.sign(fx - tx) * reach, tz]
    : [tx, tz + Math.sign(fz - tz) * reach];
  const points = [
    [fx, GRADE_FLOOR_Y, fz],
    [fx, TRANSFER_RUN_Y, fz],
    [riser[0], TRANSFER_RUN_Y, riser[1]],
    [riser[0], TRANSFER_CROSS_Y, riser[1]],
    [entry[0], TRANSFER_CROSS_Y, entry[1]],
    [entry[0], GRADE_INLET_Y, entry[1]],
  ];
  // A run between tanks on the same axis puts the riser on the line already
  // travelled, which leaves a zero-length segment the pipe builder cannot
  // orient. Drop any step that does not actually move.
  return points.filter(
    (p, i) => i === 0 || p.some((v, axis) => Math.abs(v - points[i - 1][axis]) > 1e-6)
  );
}

// How far from a tank's centre its outlet valve stands: just clear of the
// skirt, and no further. A valve belongs at the start of the line it
// isolates — everything upstream of it is volume that cannot be drained
// without opening it, and on a plant that passes one batch along five times
// that volume is exactly what the bottom outlets were meant to remove.
export const VALVE_REACH = GRADE_RADIUS + 0.3;

export function gradeTransferValvePos(from, to) {
  const [fx, , fz] = from;
  const [tx, , tz] = to;
  const alongX = Math.abs(tx - fx) > Math.abs(tz - fz);
  return alongX
    ? [fx + Math.sign(tx - fx) * VALVE_REACH, TRANSFER_RUN_Y, fz]
    : [fx, TRANSFER_RUN_Y, fz + Math.sign(tz - fz) * VALVE_REACH];
}

// Storage tank -> decomposition chamber
export function storageTransferRoute() {
  return gradeTransferRoute(BASE_POSITION, DECOMP_POSITION);
}
export const TRANSFER_VALVE_POS = gradeTransferValvePos(
  BASE_POSITION,
  DECOMP_POSITION
);

// Decomposition -> filtration
export function decompTransferRoute() {
  return gradeTransferRoute(DECOMP_POSITION, FILTRATION_POSITION);
}
export const DECOMP_TRANSFER_VALVE_POS = gradeTransferValvePos(
  DECOMP_POSITION,
  FILTRATION_POSITION
);

// Graphite discharge: a chute off the filter base into a collection bin at
// the closed end of the box. It used to run sideways, which is where lane B
// now is.
export const GRAPHITE_BIN_POSITION = [
  FILTRATION_POSITION[0] - (GRADE_RADIUS + 1.5),
  0,
  FILTRATION_POSITION[2],
];

export function graphiteChuteRoute() {
  const [fx, , fz] = FILTRATION_POSITION;
  return [
    [fx, GRADE_FLOOR_Y, fz],
    [GRAPHITE_BIN_POSITION[0], GRADE_FLOOR_Y, fz],
    [GRAPHITE_BIN_POSITION[0], 0.62, fz],
  ];
}

// ---- lane B: the return leg -------------------------------------------------
// What leaves the filter is spent solvent, not clean solvent: it has to be
// treated before it can go back into a chamber. That happens here, on the
// far side of the walkway, and the stream then works its way back toward the
// gas end of the box.
export const TREATMENT_HEIGHT = GRADE_HEIGHT;
export const TREATMENT_RADIUS = GRADE_RADIUS;
export const TREATMENT_POSITION = [FILTRATION_POSITION[0], 0, LANE_B_Z];

// Filter -> treatment: straight across the walkway. Putting the two vessels
// opposite each other is the whole point of the U — the crossover is one
// short run instead of a trip down the length of the plant.
export function solventReturnRoute() {
  return gradeTransferRoute(FILTRATION_POSITION, TREATMENT_POSITION);
}

// Isolation valve on the crossover. It sits on a Z-running leg, so it needs a
// quarter turn to face the right way.
export const SOLVENT_RETURN_VALVE_POS = gradeTransferValvePos(
  FILTRATION_POSITION,
  TREATMENT_POSITION
);

// ---- solvent inventory ------------------------------------------------------
//
// Treated solvent is held here, and this is the only vessel the absorption
// chambers are ever charged from. Splitting it out of the treatment chamber
// matters: what the filter hands over is spent, and a plant that fed the
// chambers straight off that vessel would be recharging them with the
// stream it just decided needed treating.
//
// It stands on a short skirt so it can empty out of its own floor under
// gravity — the same arrangement as the water column. The outlet is at the
// base and nowhere else; a tank whose outlet leaves halfway up the shell can
// never actually be run down.
// It sits in the bay under the far end of the deck, directly below the
// chambers it charges. That bay was the last piece of dead floor in the box —
// deck steel over nothing — and putting the last vessel in the loop there
// turns the longest pipe run in the plant into a riser two metres tall.
export const INVENTORY_HEIGHT = GRADE_HEIGHT;
export const INVENTORY_RADIUS = GRADE_RADIUS;
export const INVENTORY_POSITION = [4.7, 0, 0];
export const INVENTORY_BASE_Y = GRADE_SKIRT;
export const INVENTORY_FLOOR_Y = GRADE_FLOOR_Y;
export const INVENTORY_CENTER_Y = GRADE_CENTER_Y;
export const INVENTORY_TOP_Y = GRADE_SKIRT + GRADE_HEIGHT;

// Treatment -> inventory: the return leg, all the way back up lane B at floor
// level and then in under the deck. It is the longest line in the plant, and
// it is a straight run down an otherwise empty aisle rather than a route
// threaded past anything, which is what lane B is for.
// It enters on the shoulder rather than the crown, same as every other
// transfer — and here that also keeps it out of the way of the water column's
// drain, which comes down through the deck immediately above this tank.
const INVENTORY_INLET_X = INVENTORY_POSITION[0] - GRADE_RADIUS * INLET_OFFSET;

export function inventoryChargeRoute() {
  const [rx, , rz] = TREATMENT_POSITION;
  const [, , iz] = INVENTORY_POSITION;
  return [
    [rx, GRADE_FLOOR_Y, rz],
    [rx, TRANSFER_RUN_Y, rz],
    [INVENTORY_INLET_X, TRANSFER_RUN_Y, rz],
    [INVENTORY_INLET_X, TRANSFER_CROSS_Y, rz],
    [INVENTORY_INLET_X, TRANSFER_CROSS_Y, iz],
    [INVENTORY_INLET_X, GRADE_INLET_Y, iz],
  ];
}

// Isolation valve at the start of the run, right off the treatment chamber
export const INVENTORY_CHARGE_VALVE_POS = [
  TREATMENT_POSITION[0] + VALVE_REACH,
  TRANSFER_RUN_Y,
  TREATMENT_POSITION[2],
];

// ---- Gas circuit -----------------------------------------------------------

const VESSEL_TOP_Y = LIFT + VESSEL_HEIGHT / 2; // world Y of the A/B rims

const GAS_OUT_HEADER_Y = VESSEL_TOP_Y + 1.4; // water column -> chambers run
// Fresh-solvent feed header. Just above the chamber rims — it only has to
// clear the vessels it feeds, not the gas header, because the two run on
// opposite sides of the chambers in Z.
const SOLVENT_HEADER_Y = VESSEL_TOP_Y + 0.8;

const DIP_OFFSET = 0.4; // keep the two tubes entering W apart

// Flue stack beyond the +X end of the housing — the gas source, and the one
// piece of the model that is not part of the plant.
//
// It is drawn with its middle taken out rather than as a whole stack. A stack
// sized for this much gas is wide, and at anything like its true height it
// would be a column of empty concrete towering over the process the model is
// actually about. So a length above the tapping point is simply not drawn: the
// base runs up to a cut, the same shaft picks up again above it, and what is
// between them fades away to nothing.
//
// Wider than the container is deep, and taller than it is high. The stack is
// the one thing here that is not part of the unit, and the whole point the
// model makes is how small the plant is next to the emissions it handles —
// which only lands if the stack visibly dwarfs the box beside it.
export const CHIMNEY_X = 16.6;
export const CHIMNEY_RADIUS = 6.4; // outer radius
export const CHIMNEY_WALL = 0.62; // shell thickness, exposed at the cut
export const CHIMNEY_CUT_Y = 16.5; // where the base section stops

// Kept under its old name: cameras and labels frame "the top of the stack",
// and for those purposes that is the cut.
export const CHIMNEY_TOP_Y = CHIMNEY_CUT_Y;

// The missing length, and the piece of stack drawn above it. Both sections are
// solid and identical in section, so the whole thing reads as one chimney with
// a length left out; only what is between them is faded.
//
// The gap has to be plainly empty. Drawn tighter, the fade off each end met in
// the middle and the result read as one continuous stack — the opposite of the
// point. And the top section is dead straight at the base's radius: a taper is
// what a real stack does over its full height, but across a piece this short
// it has nothing to read as except a cone.
export const CHIMNEY_GHOST_GAP = 3.8; // the length that is not drawn
export const CHIMNEY_GHOST_H = 5.6; // the top section itself
export const CHIMNEY_GHOST_BASE_Y = CHIMNEY_CUT_Y + CHIMNEY_GHOST_GAP;
export const CHIMNEY_GHOST_TOP_Y = CHIMNEY_GHOST_BASE_Y + CHIMNEY_GHOST_H;

// The tapping line comes off the stack low, crosses into the housing through
// an opening in the end wall, and only then climbs. Bringing it in at floor
// level rather than over the roof keeps the one penetration in the skin
// small and low, where it reads as a service entry.
export const GAS_TAP_Y = 1.5;
export const GAS_RISER_X = 7.7; // riser inside the box, past the deck edge
const GAS_CROSS_Y = COLUMN_TOP_Y + 0.6; // clears the column's top head

// Chimney wall tap -> in through the end wall -> up the riser -> across and
// down into the water column, ending below the water surface.
export function gasSupplyRoute() {
  const [cx, , cz] = COLUMN_POSITION;
  const dipY = COLUMN_FLOOR_Y + 0.45; // near the column floor
  return [
    // buried a little inside the shaft wall, so the tap is in it, not on it
    [CHIMNEY_X - CHIMNEY_RADIUS + 0.3, GAS_TAP_Y, 0],
    [GAS_RISER_X, GAS_TAP_Y, 0],
    [GAS_RISER_X, GAS_CROSS_Y, 0],
    [cx + DIP_OFFSET, GAS_CROSS_Y, cz],
    [cx + DIP_OFFSET, dipY, cz],
  ];
}

// Height of the sparger disc, just above each chamber's floor
export const SPARGER_Y = LIFT - VESSEL_HEIGHT / 2 + 0.35;

// Tee directly above chamber B, where the branch taps off the main W->A run
export const BRANCH_TEE = [
  VESSEL_B_LOCAL[0],
  GAS_OUT_HEADER_Y,
  VESSEL_B_LOCAL[2],
];

// Single continuous run: straight up out of the water column head, across
// the header (passing over B), then down into chamber A, ending open just
// above its sparger disc.
export function gasMainRoute() {
  const [cx, , cz] = COLUMN_POSITION;
  const [ax, , az] = VESSEL_A_LOCAL;
  // Off the top head itself, not from a point floating below it
  return [
    [cx, COLUMN_TOP_Y, cz],
    [cx, GAS_OUT_HEADER_Y, cz],
    [ax, GAS_OUT_HEADER_Y, az],
    [ax, SPARGER_Y, az],
  ];
}

// Where the water column's drain passes down through the deck plate
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
// Chamber A's gas valve sits on the header just past the tee junction
export const GAS_A_VALVE_POS = [0.6, GAS_OUT_HEADER_Y, 0];
// On the outlet header, just after the water column's elbow
export const GAS_HEADER_VALVE_POS = [3.4, GAS_OUT_HEADER_Y, 0];

// L-shaped gas outlet vent on a chamber: short riser just inside the rim,
// then a horizontal open-ended stub pointing away from the chamber center
export function ventRoute(vesselLocal) {
  const [vx, , vz] = vesselLocal;
  const dir = Math.sign(vx) || 1;
  const x = vx + 0.55 * dir;
  return [
    [x, VESSEL_TOP_Y - 0.3, vz],
    [x, VESSEL_TOP_Y + 0.7, vz],
    [x + 0.7 * dir, VESSEL_TOP_Y + 0.7, vz],
  ];
}

// ---- fresh solvent up to the chambers ---------------------------------------
//
// This run is kept deliberately alone. It leaves through the inventory
// tank's floor, drops to a low run, and climbs a single riser standing clear
// of the shell on lane B. From there it is on its own offset in Z for its
// whole length and drops into each chamber through its own penetration, so
// it never shares a position with the gas header or the vents.
//
// It arrives from the inventory tank on the +X side, same side as the gas
// circuit's water column, so the header runs the same direction gas's does:
// the full span from the riser to chamber A, teeing off above chamber B
// along the way. Two ball valves, one per chamber, sit on this circuit the
// same way GAS_A_VALVE_POS and gasBranchValvePos sit on the gas one — either
// chamber can be shut in without touching the other.
//
// The main run has to actually reach the tee's x position for the tee to be
// something other than a disconnected stub — a header that stopped short of
// it, with the branch just starting from a point in space, was exactly the
// bug this replaced.
export const SOLVENT_FEED_Z = -0.72; // clear of the gas circuit, which is at z = 0

// Depth the feed leg reaches inside a chamber: below the rim, well clear of
// the working liquid level, so fresh solvent is delivered into the vessel
// rather than dribbled onto its lid.
const FEED_DIP_Y = LIFT + VESSEL_HEIGHT / 2 - 1.35;

// The riser stands just outside the deck's -Z edge: the tank is underneath
// the deck, so the line has to come out from under it before it can climb.
const FEED_RISER_Z = -2.7;

// Single continuous run: up out of the inventory tank, across the header
// (passing over B), then down into chamber A — the same shape as
// gasMainRoute(), just fed from the opposite corner of the deck.
export function solventFeedRoute() {
  const [ix, , iz] = INVENTORY_POSITION;
  const [ax] = VESSEL_A_LOCAL;
  return [
    [ix, INVENTORY_FLOOR_Y, iz], // out of the tank floor
    [ix, TRANSFER_RUN_Y, iz], // down to the low run
    [ix, TRANSFER_RUN_Y, FEED_RISER_Z], // out from under the deck
    [ix, SOLVENT_HEADER_Y, FEED_RISER_Z], // up the riser, clear of the deck
    [ix, SOLVENT_HEADER_Y, SOLVENT_FEED_Z], // back in over the chambers
    [ax, SOLVENT_HEADER_Y, SOLVENT_FEED_Z], // along the header, over B, to A
    [ax, FEED_DIP_Y, SOLVENT_FEED_Z], // down into A
  ];
}

// Isolation valve on the outlet drop, right under the tank floor — "at the
// start" of the line, with no dead volume above it. This one shuts off the
// whole circuit; the two below split it between the chambers.
export const SOLVENT_FEED_VALVE_POS = [
  INVENTORY_POSITION[0],
  TRANSFER_RUN_Y,
  -VALVE_REACH,
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

// Valve on the header itself, between the tee and chamber A — closing it
// isolates A without touching whatever the tee sends on to B. Same x as
// GAS_A_VALVE_POS: it is the same header geometry, just carrying solvent
// instead of gas.
export const SOLVENT_A_VALVE_POS = [0.6, SOLVENT_HEADER_Y, SOLVENT_FEED_Z];

// Valve on B's vertical drop off the tee, mirroring gasBranchValvePos —
// isolates B without touching the header run on to A. The solvent line runs
// on its own Z offset everywhere, so unlike gasBranchValvePos this doesn't
// need the vessel's own z — B's drop is at SOLVENT_FEED_Z regardless.
export function solventBranchValvePos(vesselLocal) {
  const [vx] = vesselLocal;
  return [vx, VESSEL_TOP_Y + 0.9, SOLVENT_FEED_Z];
}

// Path solvent actually takes into a given chamber: the full header run
// ending in A, or the shared run up to the tee above B and then down into
// it. Built from the main route and the branch so the two can never
// disagree — the same pattern as gasFlowPath().
export function solventFlowPath(chamber) {
  const main = solventFeedRoute();
  if (chamber === "A") return main;
  return [...main.slice(0, -2), ...solventFeedBranchRoute()];
}

// ---- chamber drains ---------------------------------------------------------

// World-space position of a vessel's floor outlet (bottom-center of the tank)
export function vesselOutletWorld(localPos, vesselHeight = VESSEL_HEIGHT) {
  const [x, y, z] = localPos;
  return [x, LIFT + y - vesselHeight / 2, z];
}

// World-space position of an inlet nub on top of the base housing
export function baseInletWorld(xOffset) {
  const [bx, by, bz] = BASE_POSITION;
  return [bx + xOffset, by + GRADE_INLET_Y, bz];
}

// Height of the horizontal cross-run between a chamber and the storage tank.
// It has to clear the tank's top head and stay under the deck steel.
const PIPE_RUN_Y = GRADE_TOP_Y + 0.3;

// Ball valve on the liquid drain pipe below a chamber, kept close to the
// chamber base so the pipe above the valve holds no dead volume
export function drainValvePos(vesselLocal) {
  const [vx, , vz] = vesselLocal;
  const outletY = LIFT - VESSEL_HEIGHT / 2;
  return [vx, outletY - 0.55, vz];
}

// Both chamber drains merge at a single junction after their valves, and one
// shared pipe drops into the storage tank. Offset from center so the down
// pipe clears whatever sits on the tank's head.
export const DRAIN_JUNCTION_X = 0.6;

// Full drain path from a chamber's floor outlet to the storage tank:
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

// ---- Exterior layer --------------------------------------------------------
//
// The real-world skin wraps the same coordinates the schematic uses. Every
// number below is derived from the values above, so the shell of a vessel
// is always concentric with the glass inside it — if it weren't, the
// cutaway toggle would look like a glitch instead of a reveal.

export const STORAGE_SHELL_RADIUS = GRADE_SHELL_RADIUS;
export const DECOMP_SHELL_RADIUS = GRADE_SHELL_RADIUS;

// Elevated steel deck carrying chambers A and B and the water column. It
// covers lane A's storage tank and stops short of the decomposition chamber.
export const DECK_X = [-3.2, 7.2]; // deck extent in X
export const DECK_Z = [-2.2, 2.2]; // deck extent in Z

// Support columns, placed to clear the storage tank standing underneath
export const COLUMN_X = [DECK_X[0] + 0.35, 2.6, DECK_X[1] - 0.35];
export const COLUMN_Z = [DECK_Z[0] + 0.3, DECK_Z[1] - 0.3];
export const COLUMN_SIZE = 0.26;

// Handrail geometry, shared by the deck edge and the ladder
export const RAIL_HEIGHT = 1.1;
export const RAIL_RADIUS = 0.045;
export const KICKPLATE_HEIGHT = 0.16;

// Access ladder up to the deck, on the far (-Z) side away from the camera's
// default framing so it never blocks the process view. It sits in the gap
// between chamber B and the water column, at the gas end of the deck.
export const LADDER_X = 6.5;
export const LADDER_Z = DECK_Z[0] - 0.14;
export const LADDER_WIDTH = 0.62;

// Leaned back off vertical, pivoting about the deck edge so the top stays
// where it lands and the foot walks out. A dead-vertical ladder is a caged
// climb you go up backwards; a leaned one is something you walk up, which is
// what a deck used this often would actually be given. Kept slight — at more
// than a few degrees the foot swings past the -Z wall of the housing.
export const LADDER_TILT = (7 * Math.PI) / 180;
// How far the grab rails stand off the ladder, measured perpendicular to it —
// out over the climb, not out to the sides.
//
// Set alongside the stringers first, and they read as two more ladder rails
// bolted to the ladder: everything was in one plane, so nothing said which
// part you hold and which part you stand on. A handrail has to be *above* the
// surface you are on, the same way a stair's is, and on a ladder leaning back
// at 7° that direction is very nearly straight out of its face. Hand height,
// which is the deck rail's height for the same reason.
export const LADDER_RAIL_STANDOFF = RAIL_HEIGHT * 0.92;

// Footprints the under-deck bracing has to keep clear of, as [minX, maxX].
// Only the storage tank stands under the deck now.
export function underDeckObstacles() {
  return [BASE_POSITION, INVENTORY_POSITION].map(([x]) => [
    x - GRADE_RADIUS,
    x + GRADE_RADIUS,
  ]);
}

// Field furniture, on the empty stretch of lane B nearest the gas end
export const CABINET_POSITION = [1.0, 0, LANE_B_Z + 0.4];
// Small maintenance platform in the walkway between the two lanes
export const PLATFORM_POSITION = [-2.8, 0.07, LANE_B_Z / 2];

// ---- plant enclosure --------------------------------------------------------
//
// A shipping container around the whole unit. Everything the plant does
// happens inside it; the flue stack and the line tapping it are the one
// exception, because the stack is the source rather than part of the machine
// and boxing it in would hide the thing the first tour stage is about. The
// tapping line therefore crosses the +X end wall through an opening, which
// is what ENCLOSURE_PORT describes.
//
// The bounds are set from what stands inside them, with clearance:
//   -X   the graphite bin at the closed end of lane A
//   +X   the deck, which ends at 7.2, and the gas riser just past it
//   -Z   the deck edge and lane A's tank shells
//   +Z   lane B's tank shells
//   +Y   the gas outlet header, the highest pipe in the plant
export const ENCLOSURE_MIN = [-15.8, 0, -3.0];
// The roof clears the gas outlet header — the highest pipe in the plant —
// with enough room over it for the valve handles standing on it. Lifting the
// grade tanks onto skirts pushed the deck, the chambers and that header up
// with them, and the roof has to follow or the handles poke through it.
export const ENCLOSURE_MAX = [8.2, 13.2, 8.4];

// Depth of the top and bottom rails, and the roof panel they frame. Shared
// with the enclosure itself so the fan skid on the roof lands on it exactly.
export const ENCLOSURE_RAIL = 0.26;
export const ENCLOSURE_ROOF_Y = ENCLOSURE_MAX[1] - ENCLOSURE_RAIL;

// Square opening in the +X end wall the flue tapping line passes through, on
// the low horizontal leg of gasSupplyRoute()
export const ENCLOSURE_PORT = {
  y: GAS_TAP_Y,
  z: 0,
  size: 1.2,
};

// Personnel gate in the -Z wall, lined up with the access ladder so there is
// a way onto the deck that is not "walk through the cargo doors". Everything
// else about the box is sealed; a plant nobody can get into is not a plant.
// Sized against the box, not against a person. At door height it read as a
// door on a 20ft box — the one detail on a plain white container that anyone
// scales the whole thing by, and it was making a housing four storeys tall
// look like something you could lift on a forklift. A tall equipment gate,
// wide enough to walk plant through, puts the box back at the size it is.
// Tall enough to clear the whole access route, which is what actually sets it
// now: the ladder leans back through this opening and its handrails stand a
// further metre out over the climb, so everything from grade to deck level is
// outboard of the wall line. At door height the wall panel cut straight
// through the rails and their posts, which looked like a modelling mistake
// from outside the sealed box — because it was one.
export const ENCLOSURE_GATE = {
  x: LADDER_X,
  width: 2.2,
  height: DECK_Y + 0.5,
};

// Ground pad the whole plant stands on. Centred on the container, and wide
// enough that its edge stays out of frame at every camera angle the orbit
// controls allow — a visible circular rim reads as a turntable.
export const PAD_CENTER = [
  (ENCLOSURE_MIN[0] + ENCLOSURE_MAX[0]) / 2,
  0,
  (ENCLOSURE_MIN[2] + ENCLOSURE_MAX[2]) / 2,
];
// Sized against the fog band rather than the plant: the pad's rim has to
// land far enough out that the haze has dissolved it before you can see it.
// At 34 it was inside the fog's old near plane and drew as a hard ellipse
// the moment the camera pulled back.
export const PAD_RADIUS = 95;

// ---- direct air capture -----------------------------------------------------
//
// A bank of ducted fans on the container roof, pulling atmospheric air in and
// pushing it down a single header into the water column. It joins the flue
// stream at the same place and for the same reason — everything that gets
// scrubbed goes through the column first — but it arrives on its own line,
// because the two sources are independent and either can run without the
// other.
//
// The skid stands on its own legs down to the floor rather than resting on
// the roof panel. It has to still be supported once the container is peeled
// away in the exterior and cutaway views, and legs are cheaper than
// explaining why a fan bank is hovering.
export const DAC_COLS = 5;
export const DAC_ROWS = 2;
export const DAC_PITCH = 1.4; // centre to centre, both ways
export const DAC_FAN_RADIUS = 0.6;
// Toward the +X end of the box — the same end the personnel gate and its
// ladder are on — rather than centred over the middle of the plant. z=4.0
// is deliberate, not just "nearby": it lands in the clear lane between the
// water column/inventory cluster at z≈0 and the deck's own support columns
// along z≈±1.9. Being on the same end as the gate is what reads as "that
// corner"; exact XZ alignment with the gate itself would sit it right over
// the ladder and the gas riser standing just inside the wall there.
//
// x is set with the plenum's own footprint in mind, not just its centre —
// it used to sit at 5.0, which put the far edge of the unit (half its width
// plus the skid's overhang) outside the +X wall entirely, hanging over the
// roof edge past the corner casting. x=4.0 keeps the whole footprint, skid
// included, inboard of the wall.
export const DAC_POSITION = [4.0, 0, 4.0];
export const DAC_PLENUM = [
  DAC_COLS * DAC_PITCH + 0.25,
  DAC_ROWS * DAC_PITCH + 0.25,
  1.1,
];
// Stood off the roof by the thickness of its own mounting flange, and no
// more. It was dead flush — DAC_LIFT of exactly zero — which put the skid's
// underside in the same plane as the roof panel and the plenum's underside in
// the same plane as the flange under it. Two surfaces at one depth is a
// coin-toss per pixel per frame, and the whole footprint of the bank flickered
// as the camera moved, worst in the cutaway where you see it from below.
//
// A couple of centimetres of standoff is also what a skid actually has, and it
// costs nothing to read: nothing about the duct is allowed above the roof line
// either (see dacDuctRoute below), because the point is a unit bolted to the
// top of the container rather than one hovering over it with a pipe on show.
// Once the container is peeled away in the exterior and cutaway views the bank
// keeps this height and is left sitting in the air with nothing under it —
// deliberate, not a support that got lost.
export const DAC_LIFT = 0.14;
export const DAC_BASE_Y = ENCLOSURE_ROOF_Y + DAC_LIFT;
export const DAC_TOP_Y = DAC_BASE_Y + DAC_PLENUM[1];

// The header runs below the roof on its own offset in Z, clear of the gas
// outlet header on the centreline, and dips into the column beside the flue
// line's dip tube.
export const DAC_DUCT_Z = 0.85;
const DAC_DUCT_Y = ENCLOSURE_ROOF_Y - 0.6;

export function dacDuctRoute() {
  const [dx, , dz] = DAC_POSITION;
  const [cx] = COLUMN_POSITION;
  return [
    // starts at the plenum's own underside — the roof line — and only ever
    // goes down from there, so no part of it is visible above the container
    [dx, DAC_BASE_Y, dz],
    [dx, DAC_DUCT_Y, dz], // down through the roof
    [dx, DAC_DUCT_Y, DAC_DUCT_Z], // across onto the header offset
    [cx, DAC_DUCT_Y, DAC_DUCT_Z], // along the box to the column
    [cx, COLUMN_FLOOR_Y + 0.45, DAC_DUCT_Z], // down into the water
  ];
}
