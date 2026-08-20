import { useSimStore } from "../store.js";
import { VIEW_MODES } from "../scene/reveal.js";

// The switch between the three representations. It sits over the canvas
// rather than inside the control panel: on a public page it is the first
// interaction, not a setting buried in the instrumentation.
//
// The order is the order you peel them: the sealed container, the plant as
// built inside it, then the schematic. Left to right is inward.
const LABELS = {
  container: "Container",
  exterior: "Exterior",
  cutaway: "Cutaway",
};

export function ViewToggle() {
  const viewMode = useSimStore((s) => s.viewMode);
  const setViewMode = useSimStore((s) => s.setViewMode);
  const index = Math.max(0, VIEW_MODES.indexOf(viewMode));

  return (
    <div
      className="view-toggle"
      role="group"
      aria-label="Model view"
      style={{ "--view-index": index }}
    >
      {VIEW_MODES.map((mode, i) => (
        <button
          key={mode}
          type="button"
          className={`view-option${mode === viewMode ? " active" : ""}`}
          aria-pressed={mode === viewMode}
          onClick={() => setViewMode(mode)}
        >
          <span className="view-option-index">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="view-option-label">{LABELS[mode]}</span>
        </button>
      ))}
      {/* Sliding peach chip + tricolour bar travel under the labels. */}
      <span className="view-thumb" aria-hidden="true" />
      <span className="view-rail" aria-hidden="true" />
    </div>
  );
}
