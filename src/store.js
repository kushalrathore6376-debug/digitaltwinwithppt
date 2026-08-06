import { create } from "zustand";

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
// a closed loop would slowly run the recovered tank dry and starve the
// chambers. A real plant tops up from a make-up drum; so does this one.
const SOLVENT_MAKEUP = 0.02; // fill units per second
const MAKEUP_BELOW = 0.55; // only tops up when the tank is below this

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
  // "exterior" = real-world skinned plant (the default public view),
  // "cutaway" = the schematic X-ray showing the process internals.
  viewMode: "exterior",
  // Where the exterior/cutaway transition currently is. Only the layers
  // this allows get mounted at all — a hidden layer still costs every
  // useFrame its components registered, which on the schematic side means
  // bubbles, flow dots and valve levers all animating behind an opaque
  // shell nobody can see through.
  revealPhase: "exterior", // "exterior" | "moving" | "cutaway"
  setRevealPhase: (phase) =>
    set((state) => (state.revealPhase === phase ? state : { revealPhase: phase })),
  // The plant runs on its own. There is no start button in the UI: this is
  // a showcase, and a model that sits inert until you find a switch shows
  // nothing. `setAutoRun` is still here for when a control unit needs it.
  autoRun: true,
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
  decompFill: 0.22, // decomposition chamber level; the fan runs only when > 0
  decompDraining: false,
  // Filtration splits what leaves decomposition into solid graphite and
  // clean solvent. It fills as the decomposition chamber empties into it.
  filtrationFill: 0.18,
  decompDwell: 0, // seconds the current batch has been stirred
  filtrationRunning: false, // separating: graphite out, solvent to recovery
  graphiteYield: 96, // kg of graphite collected in the bin, cumulative
  // Clean solvent has its own tank — it is not mixed back into the loaded
  // stream in the storage tank. The chambers refill from here.
  recoveredFill: 0.35,
  solventFeeding: false, // feed line to the chambers is live
  transferQueued: false, // transfer requested while decomp was emptying
  chambers: {
    // A is already on duty and part-saturated, so gas is sparging, dots are
    // travelling and the column is bubbling from the very first frame
    A: { phase: "active", fill: CHAMBER_CAP, saturation: 0.34 },
    B: { phase: "filling", fill: 0.52, saturation: 0 },
    W: { phase: "holding", fill: WATER_LEVEL, saturation: 0 },
  },

  setAutoRun: (value) => set({ autoRun: value }),

  // ---- guided tour --------------------------------------------------------
  // The walkthrough is on by default: for a visitor landing on the page it
  // is the story, and free orbiting is the thing you opt into.
  tourActive: true,
  tourIndex: 0,

  setTourActive: (value) => set({ tourActive: value }),

  // Bumped to ask the camera rig for a move even when the stage index has
  // not changed — resetting from an already-current stage still has to fly
  // the camera back from wherever the visitor dragged it.
  recenterNonce: 0,
  requestRecenter: () => set((state) => ({ recenterNonce: state.recenterNonce + 1 })),
  goToStage: (index, count) =>
    set((state) => {
      const next = Math.min(count - 1, Math.max(0, index));
      return next === state.tourIndex ? state : { tourIndex: next };
    }),

  setViewMode: (mode) => set({ viewMode: mode }),
  toggleViewMode: () =>
    set((state) => ({
      viewMode: state.viewMode === "exterior" ? "cutaway" : "exterior",
    })),

  // Flow is hard-clamped: past the max the line pressure would be unsafe
  setGasFlow: (value) =>
    set({
      gasFlow: Math.min(FLOW_LIMITS.max, Math.max(FLOW_LIMITS.min, value)),
    }),

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

  // Move the storage tank's contents into the decomposition chamber.
  // A new batch is only accepted when the decomposition chamber is
  // completely empty — one batch at a time. If it is busy emptying, the
  // transfer is refused but queued to start automatically once it finishes;
  // any other leftover liquid just refuses with an error.
  transferStorage: () =>
    set((state) => {
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

  // Run a separation cycle: graphite drops out to the bin and the recovered
  // solvent goes back to the storage tank. Refused while the filter is
  // still taking a batch in, or when there is nothing in it.
  runFiltration: () =>
    set((state) => {
      if (state.decompDraining) {
        return {
          error: "Batch still transferring in — wait for the filter to fill",
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

  // The decomposition chamber only empties on demand, and never while a
  // batch is still coming in from the storage tank
  emptyDecomp: () =>
    set((state) => {
      if (state.storageDraining) {
        return {
          error:
            "Transfer from storage in progress — wait for the batch to finish",
          errorTimer: ERROR_SECONDS,
        };
      }
      return { decompDraining: true };
    }),

  tick: (delta) => {
    const state = get();
    const drainRate = delta / DRAIN_SECONDS;
    const chambers = { ...state.chambers };
    let storageFill = state.storageFill;
    let storageDraining = state.storageDraining;
    let decompFill = state.decompFill;
    let decompDraining = state.decompDraining;
    let filtrationFill = state.filtrationFill;
    let filtrationRunning = state.filtrationRunning;
    let graphiteYield = state.graphiteYield;
    let recoveredFill = state.recoveredFill;
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
        phase = id === "W" ? "holding" : "filling";
        saturation = 0; // fresh solvent
        if (id === "W") waterDumped = true;
      }
      chambers[id] = { ...chamber, fill, phase, saturation };
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

    // Separation: the solid graphite drops to the bin and the recovered
    // solvent goes back to the storage tank, so the loop actually closes.
    if (filtrationRunning) {
      const separated = Math.min(FILTRATION_RATE * delta, filtrationFill);
      filtrationFill -= separated;
      graphiteYield += separated * GRAPHITE_PER_BATCH;
      recoveredFill = Math.min(1, recoveredFill + separated * SOLVENT_RECOVERY);
      if (filtrationFill <= 0.0005) {
        filtrationFill = 0;
        filtrationRunning = false;
      }
    }

    // Dumping the water column cools the system back to room temperature
    if (waterDumped) temperature = AMBIENT_TEMP;

    if (!state.autoRun) {
      if (!waterDumped) {
        temperature = Math.max(AMBIENT_TEMP, temperature - COOL_RATE * delta);
      }
      set({
        chambers,
        storageFill,
        storageDraining,
        decompFill,
        decompDraining,
        filtrationFill,
        filtrationRunning,
        graphiteYield,
        recoveredFill,
        solventFeeding,
        decompDwell,
        transferQueued,
        temperature,
        error,
        errorTimer,
      });
      return;
    }

    // The water column heats only while gas bubbles through it. When flow is
    // stopped (e.g. both chambers saturated) the temperature holds.
    const gasMoving = chambers[activeChamber].phase === "active";
    if (!waterDumped && gasMoving) {
      temperature = Math.min(MAX_TEMP, temperature + HEAT_RATE * delta);
    }

    // At the temperature threshold the water column drains itself
    if (temperature >= TEMP_THRESHOLD && chambers.W.phase !== "draining") {
      chambers.W = { ...chambers.W, phase: "draining" };
    }

    // Working chamber saturates while receiving gas — faster at higher flow,
    // scaled by the CO2 fraction actually arriving. At full saturation the
    // flow switches to the other chamber by itself, but the saturated solvent
    // stays in place until emptied manually.
    const working = chambers[activeChamber];
    if (working.phase === "active") {
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
      if (saturated) {
        activeChamber = activeChamber === "A" ? "B" : "A";
      }
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

    // Decomposition stirs its batch for a while, then discharges to the
    // filter. The dwell is what makes the stage read as a process step
    // rather than a tank things pass straight through.
    if (decompFill > 0.02 && !storageDraining && !decompDraining) {
      decompDwell += delta;
      if (decompDwell >= DECOMP_DWELL && filtrationFill <= 0.6) {
        decompDraining = true;
        decompDwell = 0;
      }
    } else if (decompFill <= 0.02) {
      decompDwell = 0;
    }

    // Make-up solvent keeps the recovered tank from ever running empty
    if (recoveredFill < MAKEUP_BELOW) {
      recoveredFill = Math.min(MAKEUP_BELOW, recoveredFill + SOLVENT_MAKEUP * delta);
    }

    // And the filter separates whatever it is holding as soon as the batch
    // has finished arriving
    if (filtrationFill > 0.02 && !decompDraining && !filtrationRunning) {
      filtrationRunning = true;
    }

    // Chambers refill solvent toward the cap; gas only reaches the working
    // chamber once it is full, and a saturated chamber is skipped entirely
    // until it gets drained.
    for (const id of ["A", "B"]) {
      const chamber = chambers[id];
      if (chamber.phase === "draining" || chamber.phase === "saturated")
        continue;
      // refilling draws from the recovered solvent tank, so the loop is
      // closed on screen as well as on paper
      const wanted = Math.min(CHAMBER_CAP, chamber.fill + delta / FILL_SECONDS);
      const drawn = Math.min(wanted - chamber.fill, recoveredFill / STORAGE_FACTOR);
      if (drawn > 0) {
        recoveredFill = Math.max(0, recoveredFill - drawn * STORAGE_FACTOR);
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

    // Water column tops itself back up to its 70% working level
    const water = chambers.W;
    if (water.phase !== "draining") {
      chambers.W = {
        ...water,
        phase: "holding",
        fill: Math.min(WATER_LEVEL, water.fill + delta / FILL_SECONDS),
      };
    }

    set({
      chambers,
      storageFill,
      storageDraining,
      decompFill,
      decompDraining,
      filtrationFill,
      filtrationRunning,
      graphiteYield,
      recoveredFill,
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

// True when gas is actually moving: process on and the working chamber full
export const isGasFlowing = (s) =>
  s.autoRun && s.chambers[s.activeChamber]?.phase === "active";

export const TEMP_LIMITS = {
  ambient: AMBIENT_TEMP,
  max: MAX_TEMP,
  threshold: TEMP_THRESHOLD,
};

// Dev-only handle so the running simulation can be inspected from the
// console (and from automated checks) without wiring a debug UI.
if (import.meta.env.DEV && typeof window !== "undefined") {
  window.__sim = useSimStore;
}
