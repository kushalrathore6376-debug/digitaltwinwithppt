import { create } from "zustand";
import { VIEW_MODES } from "./scene/reveal.js";

const FILL_SECONDS = 8; // pace of a chamber refilling its solvent
const DRAIN_SECONDS = 2.5; // how fast a vessel empties once draining starts
const CHAMBER_CAP = 0.8; // chambers never fill past 80%
const WATER_LEVEL = 0.7; // water column holds 70% unless drained

// Storage tank holds a little more than both chambers' contents combined:
// capacity = (0.8 + 0.8) * 1.1 in fill units
const STORAGE_FACTOR = 1 / (2 * CHAMBER_CAP * 1.1);

// Gas flow in litres per minute — the hard max models the pressure ceiling
export const FLOW_LIMITS = { min: 5, max: 50, warn: 40, nominal: 25 };

// Animation/saturation speed multiplier for the current flow setting
export const flowScale = (gasFlow) =>
  (gasFlow ?? FLOW_LIMITS.nominal) / FLOW_LIMITS.nominal;

// CO2 fraction of the source gas leaving the chimney
export const CO2_PURITY = 0.99;

// Real plant: at 25 LPM an absorption chamber saturates in 6 hours.
// The demo runs time accelerated so that cycle takes ~36 s on screen.
export const SATURATION_HOURS = 6;
export const TIME_SCALE = 600; // 1 real second = 10 simulated minutes
const SATURATION_SECONDS = (SATURATION_HOURS * 3600) / TIME_SCALE;

const ERROR_SECONDS = 3; // how long an error stays on screen

// ---- automation ------------------------------------------------------------
// The plant runs itself. Every hand-operated step the control panel used to
// expose now has a rule behind it, so the model is a machine rather than a
// diagram waiting to be clicked.
// Storage sends its contents on as soon as there is a worthwhile batch and
// decomposition is free. This was set near-full, which deadlocked the whole
// plant: one saturated chamber only fills the tank to about 0.73, so the
// transfer never fired, and the next chamber to saturate then had nowhere
// to drain to and sat there forever.
const STORAGE_BATCH = 0.25;
const DECOMP_DWELL = 6; // seconds a batch is stirred before discharging

// Not all the solvent comes back — separation recovers about half of it, so
// a closed loop would slowly run the inventory dry and starve the chambers.
// A real plant tops up from a make-up drum; so does this one.
const SOLVENT_MAKEUP = 0.02; // fill units per second
const MAKEUP_BELOW = 0.55; // only tops up when the tank is below this
// A drum being pumped in by hand arrives faster than the trickle the
// automation uses, or the button feels broken.
const MANUAL_MAKEUP_SCALE = 4;

// The treatment chamber works its contents off continuously into the
// inventory tank rather than in batches — it is a conditioning step, not
// another vessel things queue in.
const TREATMENT_RATE = 0.05; // fill units per second

// Where the inventory tank counts as "full" for gating transfers into it.
// This has to line up with what the panel actually displays (a whole-number
// percentage), not sit at some tighter value like 0.999 — the panel rounds
// to "100%" from 0.995 up, and a manual transfer that still succeeds while
// the reading already says 100% looks broken even though, numerically,
// there was a sliver of room left.
export const INVENTORY_FULL = 0.995;

// Filtration: how fast a batch separates, how much graphite a full batch
// yields, and how much of the batch comes back as reusable solvent.
const FILTRATION_RATE = 0.28; // fill units per second
export const GRAPHITE_PER_BATCH = 42; // kg of graphite per full filter load
const SOLVENT_RECOVERY = 0.55; // fraction returning to the storage tank

// Water column heat: builds only while gas is actually flowing through the
// column; at the threshold it drains itself, cools to room temp, and refills.
const AMBIENT_TEMP = 28;
const MAX_TEMP = 90;
const HEAT_RATE = 3;
const COOL_RATE = 8;
const TEMP_THRESHOLD = 80;

export const useSimStore = create((set, get) => ({
  // Three nested views, outermost first:
  //   "container" = the sealed shipping container the unit is built into,
  //   "exterior"  = the plant as built, with the box opened up around it,
  //   "cutaway"   = the schematic X-ray showing the process internals.
  // It opens sealed, because the first thing worth saying about this unit is
  // that the whole of it fits in a box.
  viewMode: "container",
  // Where the reveal currently is. Only the layers this allows get mounted
  // at all — a hidden layer still costs every useFrame its components
  // registered, which on the schematic side means bubbles, flow dots and
  // valve levers all animating behind a shell nobody can see through.
  revealPhase: "container", // container | opening | exterior | cutting | cutaway
  setRevealPhase: (phase) =>
    set((state) => (state.revealPhase === phase ? state : { revealPhase: phase })),
  // Automatic mode: the plant sequences itself, start to finish. Off by
  // default — every transfer then has to be asked for, one button at a time,
  // which is how the unit gets explained to someone standing in front of it.
  automate: false,

  // ---- capture source ------------------------------------------------------
  // The unit takes CO2 from one place at a time: the flue stack, or the air.
  // They share the water column, the chambers and everything downstream of
  // them, so running both at once would be two feeds into one column with no
  // way to tell whose gas was whose — on screen it just read as everything
  // moving at once. Picking one is also the honest operating case, and it is
  // what makes the two lines worth showing separately at all.
  gasIntake: true, // flue gas capture: the stack tap is open
  dacRunning: false, // direct air capture: the roof fan bank is running
  temperature: 51,
  gasFlow: FLOW_LIMITS.nominal,
  error: null,
  errorTimer: 0,
  // Gas is sparged into exactly one chamber at a time; the other stands by.
  activeChamber: "A",
  // The plant opens mid-cycle, not cold. Starting every value at zero meant
  // the first thirty seconds of the schematic were a still picture while
  // the chambers filled — the one moment a visitor is actually looking.
  storageFill: 0.28, // storage tank under the chambers, fed by their drains
  storageDraining: false, // transferring storage -> decomposition
  decompFill: 0.22, // decomposition chamber level
  decompMotor: false, // the stirrer, which is what actually decomposes a batch
  decompDraining: false,
  // Filtration splits what leaves decomposition into solid graphite and
  // clean solvent. It fills as the decomposition chamber empties into it.
  filtrationFill: 0.18,
  decompDwell: 0, // seconds the current batch has been stirred
  filtrationRunning: false, // separating: graphite out, solvent to recovery
  graphiteYield: 96, // kg of graphite collected in the bin, cumulative
  // What the filter hands over is spent solvent, and it gets its own vessel
  // to be treated in — it is never mixed back into the loaded stream in the
  // storage tank.
  treatmentFill: 0.3,
  treatmentDraining: false, // treated solvent moving on to inventory
  makeupRunning: false, // topping the inventory tank up from the make-up drum
  // Treated solvent waiting to be used. This is the only tank the chambers
  // are charged from.
  inventoryFill: 0.45,
  solventFeeding: false, // feed line to the chambers is live
  transferQueued: false, // transfer requested while decomp was emptying
  chambers: {
    // A is already on duty and part-saturated, so gas is sparging, dots are
    // travelling and the column is bubbling from the very first frame
    A: { phase: "active", fill: CHAMBER_CAP, saturation: 0.34 },
    B: { phase: "filling", fill: 0.52, saturation: 0 },
    W: { phase: "holding", fill: WATER_LEVEL, saturation: 0 },
  },

  setAutomate: (value) => set({ automate: value }),

  // The two capture systems interlock: switching one on switches the other
  // off. Enforced here rather than in the panel so it holds however it is
  // driven — the panel, the console handle, or a future tour step.
  setGasIntake: (value) =>
    set({ gasIntake: value, dacRunning: value ? false : get().dacRunning }),
  setDacRunning: (value) =>
    set({ dacRunning: value, gasIntake: value ? false : get().gasIntake }),

  // The stirrer in the decomposition chamber. It is not decoration: a batch
  // only breaks down while this is turning, and DECOMP_DWELL of it is what
  // the discharge below waits for.
  setDecompMotor: (value) =>
    set((state) => {
      if (value && state.decompFill <= 0.005) {
        return {
          error: "Decomposition chamber is empty — nothing to stir",
          errorTimer: ERROR_SECONDS,
        };
      }
      return { decompMotor: value };
    }),

  // ---- stage rail ---------------------------------------------------------
  // The model opens in free look. The rail down the left edge is a directory
  // of the equipment rather than a walkthrough, so nothing is framed until
  // someone asks for it — being flown somewhere before you have had a chance
  // to look at the thing is the wrong first second.
  tourActive: false,
  tourIndex: 0,

  setTourActive: (value) => set({ tourActive: value }),

  // ---- guided explanation --------------------------------------------------
  // The narrated run through the process, start to finish. It owns the camera,
  // the view mode and which equipment is in focus while it runs, so it turns
  // the stage rail off on the way in — two things steering the same camera
  // from different indices is how a walkthrough ends up fighting itself.
  explainActive: false,
  explainIndex: 0,
  explainPaused: false,

  startExplain: () =>
    set({
      explainActive: true,
      explainIndex: 0,
      explainPaused: false,
      tourActive: false,
    }),
  stopExplain: () => set({ explainActive: false, explainPaused: false }),
  setExplainPaused: (value) => set({ explainPaused: value }),
  // Clamped rather than wrapped, and running off the end stops it: an
  // explanation that loops back to the beginning by itself leaves someone
  // watching the same sentence twice wondering whether they missed the end.
  goToExplainStep: (index, count) =>
    set((state) => {
      if (index >= count) return { explainActive: false, explainPaused: false };
      const next = Math.max(0, index);
      return next === state.explainIndex ? state : { explainIndex: next };
    }),

  // Bumped to ask the camera rig for a move even when the stage index has
  // not changed — resetting from an already-current stage still has to fly
  // the camera back from wherever the visitor dragged it.
  recenterNonce: 0,
  requestRecenter: () => set((state) => ({ recenterNonce: state.recenterNonce + 1 })),
  // Walking the tour opens the box. Every stage after the overview frames
  // equipment that is inside it, and leaving the visitor to work out that
  // they have to dismiss the container first would make the walkthrough
  // look broken rather than sealed.
  goToStage: (index, count) =>
    set((state) => {
      const next = Math.min(count - 1, Math.max(0, index));
      const viewMode =
        next > 0 && state.viewMode === "container" ? "exterior" : state.viewMode;
      if (next === state.tourIndex && viewMode === state.viewMode) return state;
      return { tourIndex: next, viewMode };
    }),

  setViewMode: (mode) => set({ viewMode: mode }),
  // Step one layer inward, wrapping back to the sealed box at the end
  toggleViewMode: () =>
    set((state) => ({
      viewMode:
        VIEW_MODES[(VIEW_MODES.indexOf(state.viewMode) + 1) % VIEW_MODES.length],
    })),

  // Flow is hard-clamped: past the max the line pressure would be unsafe
  setGasFlow: (value) =>
    set({
      gasFlow: Math.min(FLOW_LIMITS.max, Math.max(FLOW_LIMITS.min, value)),
    }),

  // ---- the one interlock ---------------------------------------------------
  // A vessel that is being filled cannot be drained at the same time. It is
  // the only rule between vessels here, and it replaces a scatter of special
  // cases that each read as its own arbitrary refusal.
  //
  // The reason it has to be a rule rather than a race is that most of the
  // feeds in this plant are faster than the draws off them — separation puts
  // solvent into the treatment chamber three times faster than treatment
  // works it off. Opening the outlet mid-fill therefore did nothing visible:
  // the valve swung, the level kept climbing, and the control looked broken.
  //
  // Every transfer can be stopped from the panel, so "stop the feed, then
  // drain" is always available — which is the whole reason a refusal here is
  // fair rather than a dead end.
  isFilling: (vessel) => {
    const state = get();
    switch (vessel) {
      case "storage":
        return ["A", "B"].some((id) => state.chambers[id].phase === "draining");
      case "decomp":
        return state.storageDraining;
      case "filtration":
        return state.decompDraining;
      case "treatment":
        return state.filtrationRunning;
      case "inventory":
        return state.treatmentDraining || state.makeupRunning;
      default:
        return state.chambers[vessel]?.phase === "filling";
    }
  },

  setChamberFill: (id, value) =>
    set((state) => ({
      chambers: {
        ...state.chambers,
        [id]: { ...state.chambers[id], fill: value },
      },
    })),

  // Dump a vessel. Refused (with an error) if the storage tank cannot hold
  // the chamber's contents. Draining the active chamber diverts the gas
  // flow to the other chamber.
  emptyChamber: (id) =>
    set((state) => {
      if (state.chambers[id].phase === "filling") {
        return {
          error: `Chamber ${id} is being charged — stop the charge first`,
          errorTimer: ERROR_SECONDS,
        };
      }
      if (
        id !== "W" &&
        state.storageFill + state.chambers[id].fill * STORAGE_FACTOR > 1.001
      ) {
        return {
          error: "Storage tank full — transfer it to decomposition first",
          errorTimer: ERROR_SECONDS,
        };
      }
      const chambers = {
        ...state.chambers,
        [id]: { ...state.chambers[id], phase: "draining" },
      };
      let activeChamber = state.activeChamber;
      if (id === activeChamber) {
        activeChamber = id === "A" ? "B" : "A";
      }
      return { chambers, activeChamber };
    }),

  // Stop a chamber part-way through a charge or a drain, and leave it sitting
  // at whatever level it reached. "idle" rather than "empty": a chamber halted
  // half full is neither, and labelling it empty while the bar shows 40% is
  // the kind of small lie that makes the whole panel untrustworthy.
  haltChamber: (id) =>
    set((state) => {
      const chamber = state.chambers[id];
      if (chamber.phase !== "filling" && chamber.phase !== "draining")
        return state;
      const phase =
        id === "W"
          ? "holding"
          : chamber.fill >= CHAMBER_CAP - 1e-3
            ? "ready"
            : chamber.fill <= 0.005
              ? "empty"
              : "idle";
      return { chambers: { ...state.chambers, [id]: { ...chamber, phase } } };
    }),

  // Move the storage tank's contents into the decomposition chamber.
  // A new batch is only accepted when the decomposition chamber is
  // completely empty — one batch at a time. If it is busy emptying, the
  // transfer is refused but queued to start automatically once it finishes;
  // any other leftover liquid just refuses with an error.
  transferStorage: () =>
    set((state) => {
      if (get().isFilling("storage")) {
        return {
          error: "Storage tank is being filled — stop the chamber drain first",
          errorTimer: ERROR_SECONDS,
        };
      }
      if (state.decompDraining) {
        return {
          error:
            "Decomposition chamber is emptying — transfer will start when it finishes",
          errorTimer: ERROR_SECONDS,
          transferQueued: true,
        };
      }
      if (state.decompFill > 0.005) {
        return {
          error:
            "Decomposition chamber not empty — it must fully empty before receiving a new batch",
          errorTimer: ERROR_SECONDS,
        };
      }
      return { storageDraining: true };
    }),

  stopStorageTransfer: () => set({ storageDraining: false, transferQueued: false }),

  // Run a separation cycle: graphite drops out to the bin and the spent
  // solvent goes on to the treatment chamber. Refused while the filter is
  // still taking a batch in, or when there is nothing in it.
  runFiltration: () =>
    set((state) => {
      if (get().isFilling("filtration")) {
        return {
          error:
            "Filter is still being filled — stop the transfer from decomposition first",
          errorTimer: ERROR_SECONDS,
        };
      }
      if (state.filtrationFill <= 0.005) {
        return {
          error: "Filtration chamber is empty — nothing to separate",
          errorTimer: ERROR_SECONDS,
        };
      }
      return { filtrationRunning: true };
    }),

  stopFiltration: () => set({ filtrationRunning: false }),

  // Charge an absorption chamber from the inventory tank.
  //
  // With the process running this happens by itself; with it stopped this is
  // the only way to get solvent into a chamber, which is the point — "process
  // running" turns off the *sequencing*, not the plant. Every movement the
  // automation makes has a button behind it.
  chargeChamber: (id) =>
    set((state) => {
      const chamber = state.chambers[id];
      if (chamber.phase === "saturated") {
        return {
          error: `Chamber ${id} is saturated — empty it before charging`,
          errorTimer: ERROR_SECONDS,
        };
      }
      if (chamber.phase === "draining") {
        return {
          error: `Chamber ${id} is draining — wait for it to empty`,
          errorTimer: ERROR_SECONDS,
        };
      }
      if (chamber.fill >= CHAMBER_CAP - 1e-3) {
        return {
          error: `Chamber ${id} is already charged`,
          errorTimer: ERROR_SECONDS,
        };
      }
      if (state.inventoryFill <= 0.005) {
        return {
          error: "Solvent inventory is empty — add make-up solvent first",
          errorTimer: ERROR_SECONDS,
        };
      }
      if (get().isFilling("inventory")) {
        return {
          error:
            "Solvent inventory is being filled — stop the transfer into it first",
          errorTimer: ERROR_SECONDS,
        };
      }
      return {
        chambers: { ...state.chambers, [id]: { ...chamber, phase: "filling" } },
      };
    }),

  // Refill the water column to its working level
  fillColumn: () =>
    set((state) => {
      const water = state.chambers.W;
      if (water.phase === "draining") {
        return {
          error: "Water column is draining — wait for it to empty",
          errorTimer: ERROR_SECONDS,
        };
      }
      if (water.fill >= WATER_LEVEL - 1e-3) {
        return {
          error: "Water column is already at its working level",
          errorTimer: ERROR_SECONDS,
        };
      }
      return {
        chambers: { ...state.chambers, W: { ...water, phase: "filling" } },
      };
    }),

  // Work the treatment chamber's contents off into the inventory tank
  drainTreatment: () =>
    set((state) => {
      if (get().isFilling("treatment")) {
        return {
          error:
            "Treatment chamber is being filled — stop the separation first",
          errorTimer: ERROR_SECONDS,
        };
      }
      if (state.treatmentFill <= 0.005) {
        return {
          error: "Treatment chamber is empty — nothing to transfer",
          errorTimer: ERROR_SECONDS,
        };
      }
      if (state.inventoryFill >= INVENTORY_FULL) {
        return {
          error: "Solvent inventory is full",
          errorTimer: ERROR_SECONDS,
        };
      }
      return { treatmentDraining: true };
    }),

  stopTreatmentTransfer: () => set({ treatmentDraining: false }),

  // Top the inventory tank up from the make-up drum. Separation only recovers
  // about half the solvent, so a closed loop runs dry eventually and something
  // has to put the difference back.
  addMakeup: () =>
    set((state) => {
      if (state.inventoryFill >= MAKEUP_BELOW) {
        return {
          error: "Solvent inventory is above the make-up level",
          errorTimer: ERROR_SECONDS,
        };
      }
      return { makeupRunning: true };
    }),

  stopMakeup: () => set({ makeupRunning: false }),

  // The decomposition chamber empties on demand. The only thing that stops it
  // is the interlock — a batch still arriving from storage — and notably not
  // the stirrer: the motor is its own control and this is its own control, and
  // a button that refuses until you have used a different button is a button
  // that reads as broken. Automatic mode still gives every batch its dwell
  // under the stirrer; driving it by hand lets you skip that if you want to.
  emptyDecomp: () =>
    set((state) => {
      if (get().isFilling("decomp")) {
        return {
          error:
            "Batch still arriving from storage — stop the transfer in first",
          errorTimer: ERROR_SECONDS,
        };
      }
      if (state.decompFill <= 0.005) {
        return {
          error: "Decomposition chamber is empty — nothing to transfer",
          errorTimer: ERROR_SECONDS,
        };
      }
      return { decompDraining: true };
    }),

  stopDecompTransfer: () => set({ decompDraining: false }),

  tick: (delta) => {
    const state = get();
    const drainRate = delta / DRAIN_SECONDS;
    const chambers = { ...state.chambers };
    let storageFill = state.storageFill;
    let storageDraining = state.storageDraining;
    let decompFill = state.decompFill;
    let decompDraining = state.decompDraining;
    let decompMotor = state.decompMotor;
    let filtrationFill = state.filtrationFill;
    let filtrationRunning = state.filtrationRunning;
    let graphiteYield = state.graphiteYield;
    let treatmentFill = state.treatmentFill;
    let treatmentDraining = state.treatmentDraining;
    let inventoryFill = state.inventoryFill;
    let makeupRunning = state.makeupRunning;
    let solventFeeding = false;
    let decompDwell = state.decompDwell ?? 0;
    let temperature = state.temperature;
    let activeChamber = state.activeChamber;
    let waterDumped = false;

    let errorTimer = Math.max(0, state.errorTimer - delta);
    let error = errorTimer > 0 ? state.error : null;

    // Draining continues even when the process is paused, so the empty
    // buttons always work. A/B drain into the storage tank.
    for (const id of ["A", "B", "W"]) {
      const chamber = chambers[id];
      if (chamber.phase !== "draining") continue;
      const fill = Math.max(0, chamber.fill - drainRate);
      if (id !== "W") {
        storageFill = Math.min(
          1,
          storageFill + (chamber.fill - fill) * STORAGE_FACTOR,
        );
      }
      let phase = "draining";
      let saturation = chamber.saturation;
      if (fill <= 0) {
        // Idle, not refilling. It used to go straight back to "filling",
        // which meant a chamber you emptied by hand immediately recharged
        // itself — fine while the plant ran itself, useless the moment you
        // wanted to drive it. Recharging is now something that is asked for,
        // by the operator or by the automation below.
        phase = id === "W" ? "holding" : "empty";
        saturation = 0; // fresh solvent
        if (id === "W") waterDumped = true;
      }
      chambers[id] = { ...chamber, fill, phase, saturation };
    }

    // Charging: any chamber marked "filling" draws from the inventory tank
    // until it reaches its cap. Like every other transfer this sits in the
    // always-on half of the tick, so it runs whether the plant is sequencing
    // itself or being driven a button at a time.
    for (const id of ["A", "B"]) {
      const chamber = chambers[id];
      if (chamber.phase !== "filling") continue;
      const wanted = Math.min(CHAMBER_CAP, chamber.fill + delta / FILL_SECONDS);
      const drawn = Math.min(wanted - chamber.fill, inventoryFill / STORAGE_FACTOR);
      if (drawn > 0) {
        inventoryFill = Math.max(0, inventoryFill - drawn * STORAGE_FACTOR);
        solventFeeding = true;
      }
      const fill = chamber.fill + Math.max(0, drawn);
      const full = fill >= CHAMBER_CAP - 1e-3;
      chambers[id] = {
        ...chamber,
        fill,
        phase: full ? (id === activeChamber ? "active" : "ready") : "filling",
      };
    }

    // The water column tops up the same way
    const filling = chambers.W;
    if (filling.phase === "filling") {
      const fill = Math.min(WATER_LEVEL, filling.fill + delta / FILL_SECONDS);
      chambers.W = {
        ...filling,
        fill,
        phase: fill >= WATER_LEVEL - 1e-3 ? "holding" : "filling",
      };
    }

    // Storage -> decomposition transfer (also works while paused)
    if (storageDraining) {
      const move = Math.min(drainRate, storageFill, 1 - decompFill);
      storageFill -= move;
      decompFill += move;
      if (storageFill <= 0.0005) {
        storageFill = 0;
        storageDraining = false;
      } else if (decompFill >= 0.999) {
        storageDraining = false;
        error = "Decomposition chamber full — empty it first";
        errorTimer = ERROR_SECONDS;
      }
    }

    // Emptying the decomposition chamber also works while paused. When it
    // finishes, a queued transfer from the storage tank starts by itself.
    let transferQueued = state.transferQueued;
    if (decompDraining) {
      const moved = Math.min(drainRate, decompFill, 1 - filtrationFill);
      decompFill -= moved;
      filtrationFill += moved;
      if (decompFill <= 0.0005) {
        decompFill = 0;
        decompDraining = false;
        if (transferQueued && storageFill > 0) {
          storageDraining = true;
        }
        transferQueued = false;
      } else if (filtrationFill >= 0.999) {
        decompDraining = false;
        error = "Filtration chamber full — separate the batch first";
        errorTimer = ERROR_SECONDS;
      }
    }

    // Separation: the solid graphite drops to the bin and the spent solvent
    // goes on to the treatment chamber.
    if (filtrationRunning) {
      const separated = Math.min(FILTRATION_RATE * delta, filtrationFill);
      filtrationFill -= separated;
      graphiteYield += separated * GRAPHITE_PER_BATCH;
      treatmentFill = Math.min(1, treatmentFill + separated * SOLVENT_RECOVERY);
      if (filtrationFill <= 0.0005) {
        filtrationFill = 0;
        filtrationRunning = false;
      }
    }

    // Treatment works off into the inventory tank. This is the link that
    // closes the loop: nothing draws from the treatment chamber directly, the
    // chambers only ever see treated solvent. It runs on a held flag rather
    // than "whenever there is anything in there", so it can be started by
    // hand and so the valve on it has a state to animate.
    if (treatmentDraining) {
      const moved = Math.min(
        TREATMENT_RATE * delta,
        treatmentFill,
        1 - inventoryFill,
      );
      treatmentFill -= moved;
      inventoryFill += moved;
      if (treatmentFill <= 0.0005) {
        treatmentFill = 0;
        treatmentDraining = false;
      } else if (inventoryFill >= INVENTORY_FULL) {
        treatmentDraining = false;
        error = "Solvent inventory full — charge a chamber first";
        errorTimer = ERROR_SECONDS;
      }
    }

    // Make-up solvent, from the drum into the inventory tank
    if (makeupRunning) {
      inventoryFill = Math.min(
        MAKEUP_BELOW,
        inventoryFill + SOLVENT_MAKEUP * MANUAL_MAKEUP_SCALE * delta,
      );
      if (inventoryFill >= MAKEUP_BELOW - 1e-4) makeupRunning = false;
    }

    // ---- what the plant does on its own -------------------------------------
    // None of this is sequencing, so none of it waits for automatic mode.
    // Driving the unit a button at a time still loads the working chamber,
    // still heats the column and still works a batch under the stirrer;
    // automatic mode only decides who presses the buttons that follow.

    // One source at a time, and either counts as gas arriving: the stack tap
    // and the fan bank feed the same water column.
    //
    // Gas moving and solvent loading are two different things, and the plant
    // gets them wrong if they are one flag. An open tap pushes gas through the
    // column and on into the duty chamber whether that chamber holds solvent
    // or not — a blower does not wait to be told there is something to absorb
    // into. What an empty chamber does *not* do is load, which is the second
    // condition below.
    const capturing = state.gasIntake || state.dacRunning;
    const columnLive = capturing && chambers.W.fill > 0.05;

    // The working chamber loads while it is receiving gas *and* has solvent in
    // it — faster at higher flow, scaled by the CO2 fraction actually
    // arriving. At full saturation the flow moves to the other chamber by
    // itself, but the saturated solvent stays where it is until something
    // empties it.
    const working = chambers[activeChamber];
    if (capturing && working?.phase === "active") {
      const saturation = Math.min(
        1,
        working.saturation +
          (delta / SATURATION_SECONDS) * flowScale(state.gasFlow) * CO2_PURITY,
      );
      const saturated = saturation >= 1 - 1e-3;
      chambers[activeChamber] = {
        ...working,
        saturation,
        phase: saturated ? "saturated" : "active",
      };
      if (saturated) activeChamber = activeChamber === "A" ? "B" : "A";
    }

    // The chamber taking over duty has usually been sitting there full
    // ("ready") since well before the swap above — filling takes seconds,
    // saturating takes tens of times longer. Nothing else promotes "ready" to
    // "active": without this, gas never resumes into it and the process stalls
    // one saturation cycle after it starts.
    if (chambers[activeChamber]?.phase === "ready") {
      chambers[activeChamber] = { ...chambers[activeChamber], phase: "active" };
    }

    // Column temperature: it climbs whenever gas is bubbling through water,
    // whether or not a chamber is loading off it, and a dump takes it straight
    // back to ambient.
    if (waterDumped) temperature = AMBIENT_TEMP;
    else if (columnLive)
      temperature = Math.min(MAX_TEMP, temperature + HEAT_RATE * delta);
    else temperature = Math.max(AMBIENT_TEMP, temperature - COOL_RATE * delta);

    // Time under the stirrer is what decomposes a batch, and it is the only
    // thing the discharge waits for. An empty chamber has nothing to stir, so
    // the motor stops itself and the clock goes back to zero.
    if (decompMotor && decompFill > 0.02) decompDwell += delta;
    if (decompFill <= 0.02) {
      decompDwell = 0;
      decompMotor = false;
    }

    if (!state.automate) {
      set({
        chambers,
        storageFill,
        storageDraining,
        decompFill,
        decompMotor,
        decompDraining,
        filtrationFill,
        filtrationRunning,
        graphiteYield,
        treatmentFill,
        treatmentDraining,
        inventoryFill,
        makeupRunning,
        solventFeeding,
        decompDwell,
        transferQueued,
        temperature,
        activeChamber,
        error,
        errorTimer,
      });
      return;
    }

    // At the temperature threshold the water column drains itself
    if (temperature >= TEMP_THRESHOLD && chambers.W.phase !== "draining") {
      chambers.W = { ...chambers.W, phase: "draining" };
    }

    // ---- automation -------------------------------------------------------
    // A saturated chamber dumps itself to storage as soon as the tank has
    // room for it. Without this the chamber sat full forever waiting for a
    // button that no longer exists, and the whole line downstream starved.
    for (const id of ["A", "B"]) {
      const chamber = chambers[id];
      if (chamber.phase !== "saturated") continue;
      if (storageFill + chamber.fill * STORAGE_FACTOR <= 1.001) {
        chambers[id] = { ...chamber, phase: "draining" };
      }
    }

    // A full storage tank sends its batch on, once decomposition is clear
    if (
      storageFill >= STORAGE_BATCH &&
      !storageDraining &&
      !decompDraining &&
      decompFill <= 0.005
    ) {
      storageDraining = true;
    }

    // Decomposition runs its stirrer on whatever it is holding, and discharges
    // to the filter once the batch has had its time under it. The dwell is
    // what makes the stage read as a process step rather than a tank things
    // pass straight through; the clock itself runs in the always-on half.
    decompMotor = decompFill > 0.02 && !storageDraining && !decompDraining;
    if (decompMotor && decompDwell >= DECOMP_DWELL && filtrationFill <= 0.6) {
      decompDraining = true;
      decompDwell = 0;
      decompMotor = false;
    }

    // The treatment chamber works itself off as soon as it has anything in it
    if (treatmentFill > 0.005 && !treatmentDraining && inventoryFill < INVENTORY_FULL) {
      treatmentDraining = true;
    }

    // Make-up solvent keeps the inventory tank from ever running empty
    if (inventoryFill < MAKEUP_BELOW && !makeupRunning) {
      makeupRunning = true;
    }

    // And the filter separates whatever it is holding as soon as the batch
    // has finished arriving
    if (filtrationFill > 0.02 && !decompDraining && !filtrationRunning) {
      filtrationRunning = true;
    }

    // Chambers put themselves back on charge whenever they are idle and short
    // of the cap. The charging itself happens above, in the always-on half —
    // all this does is press the button.
    for (const id of ["A", "B"]) {
      const chamber = chambers[id];
      if (
        chamber.phase === "draining" ||
        chamber.phase === "saturated" ||
        chamber.phase === "filling"
      )
        continue;
      if (chamber.fill < CHAMBER_CAP - 1e-3) {
        chambers[id] = { ...chamber, phase: "filling" };
      }
    }

    // And the water column puts itself back on fill after a dump
    const water = chambers.W;
    if (water.phase === "holding" && water.fill < WATER_LEVEL - 1e-3) {
      chambers.W = { ...water, phase: "filling" };
    }

    set({
      chambers,
      storageFill,
      storageDraining,
      decompFill,
      decompMotor,
      decompDraining,
      filtrationFill,
      filtrationRunning,
      graphiteYield,
      treatmentFill,
      treatmentDraining,
      inventoryFill,
      makeupRunning,
      solventFeeding,
      decompDwell,
      transferQueued,
      temperature,
      activeChamber,
      error,
      errorTimer,
    });
  },
}));

// True when flue gas is moving: the stack tap is open, full stop. It used to
// also require the duty chamber to be charged, which meant switching the
// system on with empty chambers lit no line at all and read as a dead switch —
// the tap is open, so the gas is in the pipe, through the column and into
// whichever chamber is on duty. Whether that chamber *absorbs* any of it is a
// separate question, answered by its own fill.
//
// Direct air capture running is not this — it is the other source, and it has
// its own line.
export const isGasFlowing = (s) => s.gasIntake;

// True when either source is feeding the column, whichever one it is
export const isCapturing = (s) => s.gasIntake || s.dacRunning;

export const TEMP_LIMITS = {
  ambient: AMBIENT_TEMP,
  max: MAX_TEMP,
  threshold: TEMP_THRESHOLD,
};

// Dev-only handle so the running simulation can be inspected from the
// console (and from automated checks) without wiring a debug UI.
if (import.meta.env?.DEV && typeof window !== "undefined") {
  window.__sim = useSimStore;
}
