// Presentation mode shows the plant at a single framing — the deck itself
// already walks a visitor through the story slide by slide, so this stop
// doesn't need its own guided tour on top. Just the overview caption,
// non-interactive so the model stays draggable underneath it.
//
// Text is hardcoded rather than pulled from tour/stages.js: those entries
// only carry a camera shot and a focus list now (the narrated copy moved to
// tour/explain.js, for the guided walkthrough this slide deliberately
// doesn't run).
export function OverviewCaption() {
  return (
    <div className="tour" aria-hidden="false">
      <div className="tour-card">
        <p className="tour-index">Overview</p>
        <h2 className="tour-title">Carbon capture unit</h2>
        <p className="tour-blurb">
          The whole unit ships sealed in one container. Flue gas from the
          stack is scrubbed, absorbed into solvent, and the loaded solvent is
          recovered downstream. Drag to orbit, or step through
          Container → Exterior → Cutaway to see the plant as built and the
          process inside.
        </p>
      </div>
    </div>
  );
}
