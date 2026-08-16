import { useSimStore } from "../store.js";
import { STAGES, STAGE_COUNT } from "../tour/stages.js";

// The stage rail down the left edge: where you are in the plant, and a jump
// to anything in it.
//
// It used to sit under a caption card with Back/Next buttons, which made the
// model something you were walked through rather than something you looked
// around. The rail is the whole overlay now: a directory of the equipment,
// quiet until you hover it. Everything here is DOM rather than 3D text —
// crisp at any resolution, and it costs the renderer nothing.
export function TourOverlay() {
  const tourActive = useSimStore((s) => s.tourActive);
  const tourIndex = useSimStore((s) => s.tourIndex);
  const goToStage = useSimStore((s) => s.goToStage);
  const setTourActive = useSimStore((s) => s.setTourActive);
  const requestRecenter = useSimStore((s) => s.requestRecenter);

  // Nothing is the current stage until a dot is clicked: the model opens in
  // free look, and picking a stage is what turns the framing on.
  const current = tourActive ? tourIndex : -1;

  const select = (index) => {
    setTourActive(true);
    goToStage(index, STAGE_COUNT);
    // Clicking the stage you are already on is a request to fly back to it
    // from wherever you have dragged the camera, and the store ignores a
    // no-op index change — so ask for the move explicitly.
    if (index === current) requestRecenter();
  };

  return (
    <div className="tour">
      <ol className="tour-rail" aria-label="Plant equipment">
        {STAGES.map((stage, i) => (
          <li key={stage.id}>
            <button
              type="button"
              className={`tour-step${i === current ? " current" : ""}`}
              onClick={() => select(i)}
              aria-current={i === current ? "step" : undefined}
            >
              <span className="tour-step-dot" aria-hidden="true" />
              <span className="tour-step-label">{stage.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
