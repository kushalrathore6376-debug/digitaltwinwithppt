// The guided walkthrough: an ordered list of the process stages, each with
// its own camera framing and the set of equipment it renders.
//
// This is the single place the tour is defined. Adding a stage means adding
// an entry here and tagging the matching geometry with <Section id="…"> —
// nothing else in the app needs to know the tour got longer. The graphite
// and graphene conversion steps slot in after "decomposition" the same way,
// once their equipment exists.

// Section ids that geometry is tagged with. Kept as constants so a typo in
// a stage's focus list fails loudly at import instead of silently hiding
// the wrong equipment.
export const SECTION = {
  SOURCE: "source", // chimney, flue plume, supply line
  COLUMN: "column", // water column and its gas lines
  ABSORPTION: "absorption", // chambers A and B, spargers, vents
  STORAGE: "storage", // solvent storage tank and the chamber drains
  DECOMPOSITION: "decomposition", // decomposition vessel, motor, transfer line
  FILTRATION: "filtration", // filter, graphite bin, solvent return line
  STRUCTURE: "structure", // deck, ladders, ground furniture — context only
};

const ALL = Object.values(SECTION);

export const STAGES = [
  {
    id: "overview",
    label: "Overview",
    title: "Carbon capture unit",
    blurb:
      "Flue gas from the stack is scrubbed, absorbed into solvent, and the loaded solvent is recovered downstream. Step through with Next to walk the process end to end.",
    camera: { position: [19, 12, 25], target: [-1.2, 5.2, 0] },
    focus: ALL,
  },
  {
    id: "source",
    label: "Gas source",
    title: "Flue stack",
    blurb:
      "Combustion gas leaves the stack at roughly 99% CO₂. A tap low on the shaft draws it off before it escapes, and feeds the capture train.",
    camera: { position: [16, 8.5, 12], target: [8.4, 6.6, 0] },
    focus: [SECTION.SOURCE, SECTION.STRUCTURE],
  },
  {
    id: "column",
    label: "Conditioning",
    title: "Water column",
    blurb:
      "The gas is bubbled through water to cool and wash it. The column heats as it works, and dumps and refills itself at 80 °C.",
    camera: { position: [10.5, 4.6, 8.5], target: [4.5, 1.9, 0] },
    focus: [SECTION.COLUMN, SECTION.SOURCE, SECTION.STRUCTURE],
  },
  {
    id: "absorption",
    label: "Absorption",
    title: "Chambers A and B",
    blurb:
      "Conditioned gas sparges into whichever chamber is on line. Solvent absorbs the CO₂ until it saturates, then the duty swaps to the standby chamber automatically.",
    camera: { position: [6.5, 11, 12], target: [0, 9.2, 0] },
    focus: [SECTION.ABSORPTION, SECTION.COLUMN, SECTION.STRUCTURE],
  },
  {
    id: "storage",
    label: "Recovery",
    title: "Solvent storage",
    blurb:
      "A saturated chamber drains to the buffer tank below the deck. It holds a little more than both chambers combined, so a swap never has to wait.",
    camera: { position: [6.5, 5.2, 9], target: [0, 2.4, 0] },
    focus: [SECTION.STORAGE, SECTION.ABSORPTION, SECTION.STRUCTURE],
  },
  {
    id: "decomposition",
    label: "Decomposition",
    title: "Decomposition chamber",
    blurb:
      "Loaded solvent transfers across in single batches. The stirrer runs while a batch is in the vessel, releasing the CO₂ and dropping out solid carbon, then discharges to filtration.",
    camera: { position: [-9.5, 5.4, 8], target: [-5, 2.4, 0] },
    focus: [SECTION.DECOMPOSITION, SECTION.STORAGE, SECTION.STRUCTURE],
  },
  {
    id: "filtration",
    label: "Filtration",
    title: "Filtration system",
    blurb:
      "The batch is split here: solid graphite drops out to the collection bin, and the recovered solvent returns to the storage tank to be used again — closing the loop.",
    camera: { position: [-16, 6.2, 11.5], target: [-10.6, 1.8, 0] },
    focus: [SECTION.FILTRATION, SECTION.DECOMPOSITION, SECTION.STRUCTURE],
  },
  // Next: graphene conversion, taking the graphite on from here. It becomes an
  // entry here plus a <Section id="graphene"> around its equipment, and a
  // new id on SECTION above.
];

export const STAGE_COUNT = STAGES.length;

export function stageAt(index) {
  return STAGES[Math.min(STAGES.length - 1, Math.max(0, index))];
}
