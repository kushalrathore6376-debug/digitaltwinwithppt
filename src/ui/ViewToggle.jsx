import { useSimStore } from "../store.js";

// The switch between the two representations. It sits over the canvas
// rather than inside the control panel: on a public page it is the first
// interaction, not a setting buried in the instrumentation.
export function ViewToggle() {
  const viewMode = useSimStore((s) => s.viewMode);
  const setViewMode = useSimStore((s) => s.setViewMode);
  const cutaway = viewMode === "cutaway";

  return (
    <div className="view-toggle" role="group" aria-label="Model view">
      <button
        type="button"
        className={`view-option${cutaway ? "" : " active"}`}
        aria-pressed={!cutaway}
        onClick={() => setViewMode("exterior")}
      >
        Exterior
      </button>
      <button
        type="button"
        className={`view-option${cutaway ? " active" : ""}`}
        aria-pressed={cutaway}
        onClick={() => setViewMode("cutaway")}
      >
        Cutaway
      </button>
      {/* the sliding pill sits under the labels and does the actual motion */}
      <span className={`view-thumb${cutaway ? " right" : ""}`} aria-hidden="true" />
    </div>
  );
}
