// Opens and closes the instrumentation drawer.
//
// It lives beside the view switch rather than on the panel itself, because a
// control that dismisses a panel has to still be reachable once the panel is
// gone.
export function PanelToggle({ open, onToggle }) {
  return (
    <button
      type="button"
      className={`panel-toggle${open ? " on" : ""}`}
      onClick={onToggle}
      aria-pressed={open}
      aria-label={open ? "Hide controls" : "Show controls"}
    >
      <span aria-hidden="true">☰</span>
      <span className="panel-toggle-label">Controls</span>
    </button>
  );
}
