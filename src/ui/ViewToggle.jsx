import { useSimStore } from "../store.js";
import { VIEW_MODES } from "../scene/reveal.js";

// The switch between the three representations. It sits over the canvas
// rather than inside the control panel: on a public page it is the first
// interaction, not a setting buried in the instrumentation.
//
// Styled like the presentation nav steps — numbered chips, soft saffron
// active state, orange→green brand hairline — so the twin chrome matches
// the rest of the deck. Left to right is inward: sealed box, plant as
// built, then the schematic.
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
    <div className="view-toggle" role="group" aria-label="Model view">
      <div className="view-toggle-track">
        {VIEW_MODES.map((mode, i) => (
          <button
            key={mode}
            type="button"
            className={`view-option${mode === viewMode ? " active" : ""}${i < index ? " passed" : ""}`}
            aria-pressed={mode === viewMode}
            onClick={() => setViewMode(mode)}
          >
            <span className="view-option-index">{String(i + 1).padStart(2, "0")}</span>
            <span className="view-option-label">{LABELS[mode]}</span>
          </button>
        ))}
      </div>
      <div className="view-toggle-progress" aria-hidden="true">
        <span
          className="view-toggle-progress-fill"
          style={{ width: `${((index + 1) / VIEW_MODES.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
