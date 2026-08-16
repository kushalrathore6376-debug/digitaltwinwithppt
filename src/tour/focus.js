// Which sections are currently on screen, and how far each has faded.
//
// Like reveal.js this is deliberately outside React: it is written every
// frame, and pushing it through the store would re-render the tree on each
// one. Components read it inside useFrame.

import { SECTION } from "./stages.js";

// How present an out-of-focus section stays. It is never hidden and never
// made transparent — Section.jsx turns this into a colour shift toward the
// background, so receding equipment stays solid.
//
// Popping equipment in and out was the earlier approach and it read as
// cheap: things vanishing and rebuilding draws attention to the mechanism
// instead of the process. The camera move does the pointing now; this just
// settles everything else back a step.
export const RECEDED = 0.34;

// section id -> RECEDED (in the background) .. 1 (the current subject)
export const focus = {};
for (const id of Object.values(SECTION)) focus[id] = 1;

// How long a section takes to fade in or out
const FOCUS_SECONDS = 0.55;

// Whether the tour is driving visibility at all. With the tour off, every
// section is simply present.
let enabled = false;

export function setFocusEnabled(value) {
  enabled = value;
}

// Advance every section toward whether the current subject includes it.
// Called once a frame by the tour driver.
//
// It takes the list rather than an index into the stage rail, because there
// are two things that can be driving it now — the rail and the guided
// explanation — and they have separate step lists. A null list means
// everything is the subject.
export function stepFocus(sections, delta) {
  const step = delta / FOCUS_SECONDS;

  for (const id of Object.keys(focus)) {
    const target = !enabled || !sections || sections.includes(id) ? 1 : RECEDED;
    const diff = target - focus[id];
    if (Math.abs(diff) <= step) focus[id] = target;
    else focus[id] += Math.sign(diff) * step;
  }
}

// Smooth the raw linear fade, so a section eases in rather than ramping.
export function focusOf(id) {
  const t = focus[id] ?? 1;
  return t * t * (3 - 2 * t);
}
