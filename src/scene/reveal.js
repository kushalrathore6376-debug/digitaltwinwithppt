// Shared reveal progress. This is written every frame, so it deliberately
// lives outside zustand — pushing it through the store would re-render the
// whole React tree 60 times a second.
//
// One scalar, three stops:
//
//   0  the container, sealed. A shipping container with a plant inside it
//      and one pipe going in; that is all you see.
//   1  the plant as built, with the box opened up around it.
//   2  the schematic: cladding cut away, process internals and flow.
//
// Two stops would have fitted in a boolean. Three do not, and the two
// transitions are different animations — the box opening is a fade, the
// shell coming off is a diagonal wipe — so they get their own progress
// values rather than sharing one and switching behaviour halfway.
//
// Anything that animates on the toggle reads these inside useFrame.

export const reveal = { value: 0, target: 0 };

// Where each view mode sits on the scale. The store's viewMode is one of
// these keys, and nothing else needs to know the numbers.
export const STOPS = { container: 0, exterior: 1, cutaway: 2 };
export const VIEW_MODES = ["container", "exterior", "cutaway"];

// How long one step takes, in seconds. Going container -> cutaway in one
// jump therefore takes two of these, which is right: it is two reveals.
export const REVEAL_SECONDS = 1.1;

function clamp01(t) {
  return Math.min(1, Math.max(0, t));
}

// Ease so a sweep starts gently, moves fast through the middle, and settles
// instead of stopping dead.
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// How far the container has opened: 0 sealed, 1 fully open.
export function openAmount() {
  return easeInOutCubic(clamp01(reveal.value));
}

// How far the shell has been cut away: 0 as built, 1 schematic. Everything
// that existed before the container step reads this and is unchanged by it.
export function easedReveal() {
  return easeInOutCubic(clamp01(reveal.value - 1));
}

// Remap a 0..1 progress value into a sub-window of a reveal, clamped.
// Lets one element lead and another trail within the same transition.
export function stagger(t, start, end) {
  return Math.min(1, Math.max(0, (t - start) / (end - start)));
}

// Which named phase the reveal is currently at or between. The store keeps
// this so React can mount only the layers a given moment needs.
export function phaseOf(value, target) {
  if (value === target) {
    if (value <= STOPS.container) return "container";
    if (value >= STOPS.cutaway) return "cutaway";
    return "exterior";
  }
  return value < STOPS.exterior ? "opening" : "cutting";
}

// How present each layer is right now. The exterior fades out on the tail of
// the wipe; the schematic arrives behind it. Anything that fades has to go
// through these rather than reading `reveal` directly, so a section fade and
// a layer fade multiply instead of overwriting each other.
export function layerFactor(layer) {
  // "shared" is for equipment that belongs to every view — the stack, the
  // ground, the container — which must not fade when the layers cross over.
  if (layer === "shared") return 1;
  const t = easedReveal();
  return layer === "cutaway" ? stagger(t, 0.35, 1) : 1 - stagger(t, 0.55, 1);
}
