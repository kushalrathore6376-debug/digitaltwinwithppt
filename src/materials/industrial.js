// Material presets for the exterior layer.
//
// Deliberately flat and texture-free. An earlier version generated normal,
// roughness and colour maps procedurally for photoreal PBR; it looked
// convincing in stills and cost far too much to keep smooth — every surface
// sampled three textures, and the environment probe and shadow pass had to
// run to make any of it read.
//
// What replaces it is a stylised look: a tight palette, matte surfaces with
// just enough metalness to catch the key light, and emissive accents that
// carry the eye. It holds up in motion, which matters more here than any
// still frame, and it is a fraction of the work per pixel.
//
// The export names are unchanged, so call sites read the same.

// One palette for the whole plant. Keeping every surface on these few
// values is what makes it read as one designed object rather than a
// collection of parts that happen to be near each other.
export const PALETTE = {
  shell: "#9fb0c4", // primary equipment
  shellWarm: "#c39a72", // the standby chamber, so the pair reads as a pair
  shellDeep: "#6f7f94", // secondary vessels
  steel: "#7e8b9c", // structure
  steelDark: "#5b6675", // beams, shadowed structure
  trim: "#aebccc", // rings, collars, fittings
  concrete: "#6d7178",
  accent: "#6ee7ff", // flow, active state
  accentWarm: "#ffb45c", // the second chamber's flow
  hazard: "#e0a83c",
  dark: "#232a33",
};

// Painted process vessel. Matte, slightly metallic — the sheen comes from
// the key light alone, so there is nothing to sample.
export function paintedSteel(tint = PALETTE.shell) {
  return { color: tint, metalness: 0.25, roughness: 0.52, flatShading: false };
}

// Same paint, marginally duller. Kept as a separate name because the tall
// outdoor walls want to sit back from the fittings on top of them.
export function weatheredSteel(tint = PALETTE.shellDeep) {
  return { color: tint, metalness: 0.2, roughness: 0.62 };
}

// Structural steel: handrails, ladders, frames, brackets.
export function galvanised(tint = PALETTE.steel) {
  return { color: tint, metalness: 0.45, roughness: 0.4 };
}

// Brighter metal for fittings that should catch the light and pick out an
// edge — collars, flanges, nozzle stubs.
export function stainless(tint = PALETTE.trim) {
  return { color: tint, metalness: 0.6, roughness: 0.24 };
}

// Process piping. Bright, hard and clearly metallic: the lines are carbon
// steel, and at this palette's low saturation the only thing separating a
// pipe from the vessel behind it is how sharply it takes the light.
export function processPipe(tint = "#ccd6e0") {
  // Light galvanised steel rather than dark carbon: it is what process
  // lines are actually finished in, and against dark vessels a light pipe
  // is the only thing that keeps a run readable across the whole plant.
  return { color: tint, metalness: 0.62, roughness: 0.3 };
}

// Kept as an alias so existing call sites read the same.
export const insulationJacket = processPipe;

// Concrete: pads, plinths, the chimney shaft.
export function concrete(tint = PALETTE.concrete) {
  return { color: tint, metalness: 0.0, roughness: 0.85 };
}

// Walkway decking. Flat-shaded so the facets catch the light and give the
// deck some texture without a texture.
export function checkerPlate(tint = "#69737f") {
  return { color: tint, metalness: 0.35, roughness: 0.55 };
}

// Safety yellow for kick plates, bollards and hazard bands.
export function safetyYellow() {
  return { color: PALETTE.hazard, metalness: 0.1, roughness: 0.5 };
}

// Dark rubber: gaskets, hoses, cable sheathing, fan blades.
export function rubber(tint = "#242931") {
  return { color: tint, metalness: 0.0, roughness: 0.9 };
}

// Gauge and sight-port glass.
export function glass(tint = "#cfe2f2") {
  return {
    color: tint,
    metalness: 0.2,
    roughness: 0.08,
    transparent: true,
    opacity: 0.5,
  };
}

// Anything that should glow: flow pulses, beacons, status lights. Unlit on
// purpose, so the colour stays exactly as specified from every angle and
// under every light.
export function emissive(tint = PALETTE.accent, intensity = 1) {
  return {
    color: tint,
    emissive: tint,
    emissiveIntensity: intensity,
    toneMapped: false,
  };
}
