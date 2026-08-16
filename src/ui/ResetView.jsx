import { useSimStore } from "../store.js";
import { STAGE_COUNT } from "../tour/stages.js";

// Puts everything back to the opening state: exterior view, stage one, tour
// running, camera flying back to the wide shot.
//
// Free orbit makes it very easy to end up under the deck or behind the
// stack with no idea which way is out. This is the way back, and it is
// always in the same place.
export function ResetView() {
  const setViewMode = useSimStore((s) => s.setViewMode);
  const setTourActive = useSimStore((s) => s.setTourActive);
  const goToStage = useSimStore((s) => s.goToStage);
  const requestRecenter = useSimStore((s) => s.requestRecenter);

  return (
    <button
      type="button"
      className="reset-view"
      onClick={() => {
        setViewMode("exterior");
        setTourActive(true);
        goToStage(0, STAGE_COUNT);
        // The stage may already be 0, in which case nothing above changes
        // and the camera would stay put — so ask for the move explicitly.
        requestRecenter();
      }}
      title="Back to the overview"
    >
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        <path
          d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"
          fill="currentColor"
        />
      </svg>
      Reset view
    </button>
  );
}
