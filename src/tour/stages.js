// The stage rail: an ordered list of everything in the plant worth framing,
// each with its own camera and the set of equipment it brings forward.
//
// This is the single place the rail is defined. Adding a stage means adding
// an entry here and tagging the matching geometry with <Section id="…"> —
// nothing else in the app needs to know the list got longer. The graphite and
// graphene conversion steps slot in after "decomposition" the same way, once
// their equipment exists.
//
// There is one stage per vessel now, rather than one per process step. The
// rail is how you get around the model, so anything with a nameplate on it
// needs a dot; grouping three tanks behind a single "filtration" dot meant
// two of them could only be reached by dragging.

// Section ids that geometry is tagged with. Kept as constants so a typo in
// a stage's focus list fails loudly at import instead of silently hiding
// the wrong equipment.
export const SECTION = {
  SOURCE: "source", // flue stack and the supply line
  DAC: "dac", // roof fan bank and the air header it feeds
  COLUMN: "column", // water column and its gas lines
  ABSORPTION: "absorption", // chambers A and B, spargers, vents
  STORAGE: "storage", // solvent storage tank and the chamber drains
  DECOMPOSITION: "decomposition", // decomposition vessel, motor, transfer line
  FILTRATION: "filtration", // filter, graphite bin, chute
  TREATMENT: "treatment", // spent solvent treatment chamber
  INVENTORY: "inventory", // solvent inventory tank and the feed to the chambers
  STRUCTURE: "structure", // deck, ladders, ground furniture — context only
};

const ALL = Object.values(SECTION);
const S = SECTION;

export const STAGES = [
  {
    id: "overview",
    label: "Overview",
    // Wide enough to take in the container and the stack together
    camera: { position: [29, 18, 36], target: [3.6, 7, 2] },
    focus: ALL,
  },
  {
    id: "source",
    label: "Flue stack",
    camera: { position: [36, 15, 26], target: [16.2, 8, 0] },
    focus: [S.SOURCE, S.STRUCTURE],
  },
  {
    id: "dac",
    label: "Air capture fans",
    camera: { position: [12, 20, 15], target: [5, 14.5, 4] },
    focus: [S.DAC, S.COLUMN, S.STRUCTURE],
  },
  {
    id: "column",
    label: "Water column",
    camera: { position: [14, 13, 13], target: [4.8, 8.4, 0] },
    focus: [S.COLUMN, S.SOURCE, S.DAC, S.STRUCTURE],
  },
  {
    id: "absorption",
    label: "Absorption A / B",
    camera: { position: [8, 13.5, 15], target: [0, 8.8, 0] },
    focus: [S.ABSORPTION, S.COLUMN, S.STRUCTURE],
  },
  {
    id: "storage",
    label: "Solvent storage",
    camera: { position: [9, 6.5, 12], target: [0, 2.6, 0] },
    focus: [S.STORAGE, S.ABSORPTION, S.STRUCTURE],
  },
  {
    id: "decomposition",
    label: "Decomposition",
    camera: { position: [-10, 7, 11], target: [-5.4, 2.8, 0] },
    focus: [S.DECOMPOSITION, S.STORAGE, S.STRUCTURE],
  },
  {
    id: "filtration",
    label: "Filtration",
    camera: { position: [-18, 7.5, 11], target: [-11.5, 2.6, 0] },
    focus: [S.FILTRATION, S.DECOMPOSITION, S.STRUCTURE],
  },
  {
    id: "treatment",
    label: "Solvent treatment",
    camera: { position: [-17, 7.5, 16], target: [-10.8, 2.8, 5.6] },
    focus: [S.TREATMENT, S.FILTRATION, S.STRUCTURE],
  },
  {
    id: "inventory",
    label: "Solvent inventory",
    camera: { position: [12, 7, 13], target: [4.7, 3.2, 0] },
    focus: [S.INVENTORY, S.ABSORPTION, S.STRUCTURE],
  },
];

export const STAGE_COUNT = STAGES.length;

export function stageAt(index) {
  return STAGES[Math.min(STAGES.length - 1, Math.max(0, index))];
}
