// Shared reveal progress: 0 = exterior shell fully closed, 1 = fully cut
// away to the schematic. This is written every frame, so it deliberately
// lives outside zustand — pushing it through the store would re-render the
// whole React tree 60 times a second.
//
// Anything that animates on the toggle reads `reveal.value` inside useFrame.

export const reveal = { value: 0, target: 0 };

// How long a full open/close takes, in seconds
export const REVEAL_SECONDS = 1.1;

// Ease so the sweep starts gently, moves fast through the middle, and
// settles instead of stopping dead.
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Eased reveal, which is what visuals should actually key off
export function easedReveal() {
  return easeInOutCubic(Math.min(1, Math.max(0, reveal.value)));
}

// Remap a 0..1 progress value into a sub-window of the reveal, clamped.
// Lets one element lead and another trail within the same transition.
export function stagger(t, start, end) {
  return Math.min(1, Math.max(0, (t - start) / (end - start)));
}

// How present each layer is right now. The exterior fades out on the tail
// of the wipe; the schematic arrives behind it. Anything that fades has to
// go through these rather than reading `reveal` directly, so a section fade
// and a layer fade multiply instead of overwriting each other.
export function layerFactor(layer) {
  // "shared" is for equipment that belongs to both views — the stack, the
  // ground — which must not fade when the layers cross over.
  if (layer === "shared") return 1;
  const t = easedReveal();
  return layer === "cutaway" ? stagger(t, 0.35, 1) : 1 - stagger(t, 0.55, 1);
}
