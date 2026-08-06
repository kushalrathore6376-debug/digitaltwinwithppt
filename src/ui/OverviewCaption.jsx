import { stageAt } from "../tour/stages.js";

// Presentation mode shows the plant at a single framing — the deck itself
// already walks a visitor through the story slide by slide, so this stop
// doesn't need its own guided tour on top. Just the overview caption,
// non-interactive so the model stays draggable underneath it.
export function OverviewCaption() {
  const stage = stageAt(0);
  return (
    <div className="tour" aria-hidden="false">
      <div className="tour-card">
        <p className="tour-index">Overview</p>
        <h2 className="tour-title">{stage.title}</h2>
        <p className="tour-blurb">
          Flue gas from the stack is scrubbed, absorbed into solvent, and the
          loaded solvent is recovered downstream. Drag to orbit, or switch to
          the cutaway view to see the process inside.
        </p>
      </div>
    </div>
  );
}
