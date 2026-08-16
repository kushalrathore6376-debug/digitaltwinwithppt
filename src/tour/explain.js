import { SECTION } from "./stages.js";
import {
  gasSupplyRoute,
  dacDuctRoute,
  gasMainRoute,
  drainRoute,
  storageTransferRoute,
  decompTransferRoute,
  solventReturnRoute,
  inventoryChargeRoute,
  solventFeedRoute,
  VESSEL_A_LOCAL,
} from "../layout.js";

// The guided explanation: the plant talked through end to end, in order.
//
// This is a different thing from the stage rail beside it. The rail is a
// directory — you pick a vessel and it takes you there. This is a narrative,
// and the difference that matters is the steps *between* the vessels: half of
// the entries here frame two pieces of equipment at once and draw the line
// between them, because the process is the connections, and a walkthrough that
// only ever shows one tank at a time never says how any of it joins up.
//
// Every arrow follows a real route out of layout.js rather than a line drawn
// for the occasion. If the pipework moves, the explanation moves with it, and
// it can never end up pointing at where a pipe used to be.
//
// Register is technical and declarative: unit operations named as such, the
// state of the stream at each boundary, and the plant's own parameters quoted
// where they are the point. Every figure quoted here — nominal feed, cycle
// time, dump set point, yield per charge, recovery per pass — is read off the
// same constants the simulation runs on, so the narration cannot drift from
// the model it is describing. If a constant in store.js changes, the sentence
// quoting it is wrong, and that is deliberate: it is a claim about this plant,
// not decoration.
//
// Still one or two sentences a step. Density is in the vocabulary, not the
// length — the text has to be readable before the camera has finished moving,
// and on a phone it has three lines.

const A = VESSEL_A_LOCAL;

export const EXPLAIN_STEPS = [
  {
    id: "overview",
    view: "exterior",
    camera: { position: [30, 17, 34], target: [3.6, 7, 2] },
    focus: null, // everything
    seconds: 9,
    text: "Containerised post-combustion capture unit, operating on a slipstream from the adjacent stack. Gas conditioning, cyclic chemisorption, solid carbon recovery and solvent regeneration are integrated within a single transportable envelope.",
  },
  {
    id: "stack",
    view: "exterior",
    // High and back, so the whole stack is in frame at once: the mouth with
    // the plume leaving it, the length below, and the plant standing beside it
    // at a fifth of its height. The line about what escapes the top only lands
    // if the top is on screen, and the size comparison only lands if both
    // things are — a tight shot of the shaft has neither.
    camera: { position: [34, 27, 26], target: [15.6, 13.5, 0] },
    focus: [SECTION.SOURCE, SECTION.STRUCTURE],
    seconds: 8,
    text: "The stack is the emission source: combustion products discharge to atmosphere at the crown. The unit intercepts a slipstream well below that point, so capture imposes no change on stack draught.",
  },
  {
    id: "stack-to-column",
    view: "cutaway",
    camera: { position: [33, 15, 29], target: [10.5, 6.5, 0] },
    focus: [SECTION.SOURCE, SECTION.COLUMN, SECTION.STRUCTURE],
    seconds: 10,
    arrow: gasSupplyRoute,
    text: "The tapping line is drawn off the shaft at low elevation, penetrates the enclosure wall and terminates below liquid level in the conditioning column. A single ball valve at the header is the only isolation in the run.",
  },
  {
    id: "dac",
    view: "cutaway",
    camera: { position: [13, 19, 16], target: [5, 13.5, 3] },
    focus: [SECTION.DAC, SECTION.COLUMN, SECTION.STRUCTURE],
    seconds: 9,
    arrow: dacDuctRoute,
    text: "Alternative intake: a forced-draught direct-air-capture bank discharging to the same header. The two sources are interlocked — one intake at a time, so column loading is attributable to a single stream.",
  },
  {
    id: "column",
    view: "cutaway",
    camera: { position: [13, 12, 12], target: [4.8, 8.2, 0] },
    focus: [SECTION.COLUMN, SECTION.SOURCE, SECTION.DAC],
    seconds: 11,
    text: "Direct-contact water column. Gas is sparged below the surface for particulate scrubbing and sensible-heat removal; the inventory takes up that heat and is dumped and recharged at an 80 °C set point, referenced to 28 °C ambient.",
  },
  {
    id: "column-to-absorption",
    view: "cutaway",
    camera: { position: [12, 15, 19], target: [2.4, 10, 0] },
    focus: [SECTION.COLUMN, SECTION.ABSORPTION, SECTION.STRUCTURE],
    seconds: 9,
    arrow: gasMainRoute,
    text: "Conditioned gas leaves the column head and is distributed along the header to the duty absorber. The standby train is isolated at its branch valve — one vessel receives gas at any time.",
  },
  {
    id: "absorption",
    view: "cutaway",
    camera: { position: [8, 13, 14], target: [0, 8.8, 0] },
    focus: [SECTION.ABSORPTION, SECTION.COLUMN],
    seconds: 12,
    text: "Chemisorption stage. Gas is sparged through a lean solvent inventory held at 80 % of vessel volume, and CO₂ is bound into the liquid phase. Loading reaches saturation in approximately six hours at the nominal 25 L·min⁻¹ feed, at which point duty transfers to the parallel train.",
  },
  {
    id: "absorption-to-storage",
    view: "cutaway",
    camera: { position: [10, 10, 17], target: [0, 5.5, 0] },
    focus: [SECTION.ABSORPTION, SECTION.STORAGE, SECTION.STRUCTURE],
    seconds: 9,
    arrow: () => drainRoute(A),
    text: "At saturation the rich solvent is gravity-drained to the buffer tank below the deck. The buffer decouples the continuous absorption cycle from the batch operations downstream of it.",
  },
  {
    id: "storage-to-decomposition",
    view: "cutaway",
    camera: { position: [-3, 9, 18], target: [-3, 4, 0] },
    focus: [SECTION.STORAGE, SECTION.DECOMPOSITION, SECTION.STRUCTURE],
    seconds: 9,
    arrow: storageTransferRoute,
    text: "A batch is charged to the agitated decomposition reactor. Under agitation the bound carbon is reduced out of solution to a solid phase; residence time under the stirrer governs conversion.",
  },
  {
    id: "decomposition-to-filtration",
    view: "cutaway",
    camera: { position: [-14, 8, 15], target: [-8.5, 3.5, 0] },
    focus: [SECTION.DECOMPOSITION, SECTION.FILTRATION, SECTION.STRUCTURE],
    seconds: 8,
    arrow: decompTransferRoute,
    text: "Reactor discharge to solid–liquid separation. The slurry is resolved into a solid carbon fraction and the depleted solvent filtrate.",
  },
  {
    id: "graphite",
    view: "cutaway",
    // The same three-quarter as the step before it, nudged along the row.
    // Filtration is the one stage with an output that leaves the plant, so the
    // shot has to hold the filter *and* the bin under its chute — a tight
    // framing on the vessel put the product off the edge of the screen, which
    // is the one thing this step is about. Standing off also keeps the vessels
    // either side in frame, so it stays legible where in the line this is.
    camera: { position: [-16, 8.5, 15], target: [-11.6, 3.2, 0.6] },
    focus: [SECTION.FILTRATION, SECTION.STRUCTURE],
    seconds: 9,
    text: "The solid fraction discharges through the chute as graphite: the product stream, and the terminal sink for the captured carbon. Yield is of the order of 42 kg per full filter charge.",
  },
  {
    id: "filtration-to-treatment",
    view: "cutaway",
    camera: { position: [-16, 9, 18], target: [-11, 3.4, 3] },
    focus: [SECTION.FILTRATION, SECTION.TREATMENT, SECTION.STRUCTURE],
    seconds: 9,
    arrow: solventReturnRoute,
    text: "The filtrate is spent, not lean. It is routed to a dedicated reconditioning chamber rather than returned directly to service, so degraded solvent never re-enters the absorbers.",
  },
  {
    id: "treatment-to-inventory",
    view: "cutaway",
    camera: { position: [-2, 9, 20], target: [-3, 3.4, 3] },
    focus: [SECTION.TREATMENT, SECTION.INVENTORY, SECTION.STRUCTURE],
    seconds: 9,
    arrow: inventoryChargeRoute,
    text: "Reconditioned solvent is transferred to the lean inventory — the single point of supply to both absorbers, and the boundary between the regeneration and absorption sides of the loop.",
  },
  {
    id: "inventory-to-absorption",
    view: "cutaway",
    camera: { position: [12, 10, 16], target: [3, 6, 0] },
    focus: [SECTION.INVENTORY, SECTION.ABSORPTION, SECTION.STRUCTURE],
    seconds: 11,
    arrow: solventFeedRoute,
    text: "Lean solvent is charged back to the absorbers, closing the circuit. Recovery is approximately 55 % per pass; the deficit is made up from the drum, and that make-up rate is the plant's solvent consumption per tonne captured.",
  },
  {
    id: "close",
    // The box closes back up for the ending.
    //
    // Every other step has been inside the machine, and the reveal running
    // backwards — schematic, to plant, to sealed container — puts the shell
    // back on over everything that has just been explained. It is the one move
    // that says the whole of it ships as a unit, and it says it without a
    // sentence: you watch the thing you have been shown around get wrapped up.
    //
    // Framed on the container rather than on the wide overview. The stack is
    // still in shot at the edge, which is the comparison worth ending on — all
    // of that, dealt with by this.
    view: "container",
    camera: { position: [24, 12, 33], target: [-2.6, 6.2, 2.6] },
    focus: null,
    // Longer than the rest: two reveal steps run back to back on the way in,
    // and the box should be shut and still for a beat before the caption goes.
    seconds: 12,
    text: "Single-source intake, cyclic chemisorption, carbon recovered as solid graphite, solvent reconditioned and recirculated — the complete unit-operations set, inside one transportable enclosure.",
  },
];

export const EXPLAIN_COUNT = EXPLAIN_STEPS.length;

export function explainStepAt(index) {
  return EXPLAIN_STEPS[Math.min(EXPLAIN_COUNT - 1, Math.max(0, index))];
}
