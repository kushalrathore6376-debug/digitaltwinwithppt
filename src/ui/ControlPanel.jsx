import { useSimStore, TEMP_LIMITS, INVENTORY_FULL } from "../store.js";

const CHAMBER_LABELS = {
  A: "Absorption Chamber A",
  B: "Absorption Chamber B",
  W: "Water Column",
};

// A level bar with no controls of its own — the vessels that are only ever
// filled and emptied by the vessel either side of them.
function Meter({ value, tone = "decomp" }) {
  return (
    <div className="temp-bar">
      <div
        className={`temp-fill ${tone}`}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  );
}

// The action on a vessel card.
//
// `busy` means the transfer this button starts is currently running. Given an
// `onStop` it turns into the stop for that transfer, which is what makes the
// interlock in the store fair: a vessel being filled refuses to drain, and the
// control that stops the filling is always the one already on screen. Without
// that, "stop the feed first" would be advice with no button behind it.
//
// `locked` is automatic mode holding the control: the plant is making this
// move itself, so the button greys and says why rather than disappearing.
function Action({
  onClick,
  onStop,
  disabled,
  busy,
  busyLabel,
  stopLabel = "Stop",
  locked,
  tone = "act",
  children,
}) {
  const stopping = busy && onStop && !locked;
  return (
    <button
      type="button"
      className={stopping ? "empty-btn" : `${tone}-btn`}
      disabled={locked || (!stopping && (disabled || busy))}
      title={locked ? "Automatic mode is driving this" : undefined}
      onClick={stopping ? onStop : onClick}
    >
      {stopping ? stopLabel : busy ? busyLabel : children}
    </button>
  );
}

// `compact` is a phone: the drawer is a sheet across the bottom third of the
// screen there, so a label that runs to three words costs a button's worth of
// height. The long forms are kept for the desktop, where they earn their room.
export function ControlPanel({ open, onClose, compact = false }) {
  const s = useSimStore();
  const {
    chambers,
    automate,
    gasIntake,
    dacRunning,
    activeChamber,
    temperature,
    error,
    storageFill,
    storageDraining,
    transferQueued,
    decompFill,
    decompMotor,
    decompDraining,
    filtrationFill,
    filtrationRunning,
    treatmentFill,
    treatmentDraining,
    inventoryFill,
    makeupRunning,
  } = s;

  const tempPct =
    ((temperature - TEMP_LIMITS.ambient) /
      (TEMP_LIMITS.max - TEMP_LIMITS.ambient)) *
    100;
  const overheating = temperature >= TEMP_LIMITS.threshold;
  const capturing = gasIntake || dacRunning;

  return (
    <div className={`panel${open ? "" : " hidden"}`} aria-hidden={!open}>
      <div className="panel-header">
        <h2 className="panel-title">Digital Twin Controls</h2>
        {onClose && (
          <button
            type="button"
            className="panel-close"
            onClick={onClose}
            aria-label="Close controls"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
      <p className="panel-subtitle">
        A live virtual replica of the gas-capture unit. Automate it and it
        sequences itself; leave that off and every transfer in the plant is
        yours to make, one button at a time.
      </p>

      {error && <div className="error-banner">⚠ {error}</div>}

      <div className="run-toggle">
        <span>Automate</span>
        <button
          type="button"
          className={`toggle-btn${automate ? " on" : ""}`}
          onClick={() => s.setAutomate(!automate)}
          aria-label="Toggle automatic mode"
        />
      </div>
      <p className="panel-subtitle">
        {automate
          ? "Running itself — charging, draining, stirring and separating are all being sequenced for you."
          : "Manual — each vessel below is driven by its own buttons. A vessel being filled cannot be drained at the same time: stop the feed into it first, using the button that started it."}
      </p>

      <div className="run-toggle">
        <span>Flue Gas Capture system</span>
        <button
          type="button"
          className={`toggle-btn${gasIntake ? " on" : ""}`}
          onClick={() => s.setGasIntake(!gasIntake)}
          aria-label="Toggle flue gas capture system"
        />
      </div>

      <div className="run-toggle">
        <span>Direct Air Capture system</span>
        <button
          type="button"
          className={`toggle-btn${dacRunning ? " on" : ""}`}
          onClick={() => s.setDacRunning(!dacRunning)}
          aria-label="Toggle direct air capture system"
        />
      </div>
      <p className="panel-subtitle">
        {capturing
          ? `Intake: ${gasIntake ? "flue gas, tapped off the stack" : "ambient air, off the roof fans"}. One source at a time — switching one on switches the other off.`
          : "No intake selected — the duty chamber is not loading."}
      </p>

      <div className="temp-card">
        <div className="chamber-head">
          <span className="chamber-name">Water column temperature</span>
          <span className={`temp-value${overheating ? " hot" : ""}`}>
            {temperature.toFixed(0)}°C
          </span>
        </div>
        <div className="temp-bar">
          <div
            className={`temp-fill${overheating ? " hot" : ""}`}
            style={{ width: `${Math.max(0, Math.min(100, tempPct))}%` }}
          />
        </div>
        <p className="temp-hint">
          {automate
            ? "Dumps and refills by itself once it runs hot."
            : "Climbs while gas bubbles through it — empty and refill it yourself before it overheats."}
        </p>
      </div>

      {Object.entries(chambers).map(([id, chamber]) => {
        const draining = chamber.phase === "draining";
        const filling = chamber.phase === "filling";
        return (
          <div key={id} className="chamber-card">
            <div className="chamber-head">
              <span className="chamber-name">{CHAMBER_LABELS[id] ?? id}</span>
              <span className={`phase-badge ${chamber.phase}`}>
                {id === activeChamber && id !== "W" && chamber.phase === "active"
                  ? "receiving gas"
                  : chamber.phase}
              </span>
            </div>
            {/* A level, shown as a level. It was a range input, which made
                the contents of a vessel something you could drag to any value
                you liked — a control that exists in no plant, sitting where
                the reading should be. The buttons below move liquid; this
                says how much of it is there. */}
            <div className="fill-row">
              <Meter value={chamber.fill} tone={id === "W" ? "sat" : "decomp"} />
              <span className="fill-value">
                {(chamber.fill * 100).toFixed(0)}%
              </span>
            </div>
            {id !== "W" && (
              <div className="sat-row">
                <span className="sat-label">Saturation</span>
                <div className="temp-bar sat-bar">
                  <div
                    className={`temp-fill sat${chamber.saturation >= 1 ? " hot" : ""}`}
                    style={{ width: `${chamber.saturation * 100}%` }}
                  />
                </div>
                <span className="fill-value">
                  {(chamber.saturation * 100).toFixed(0)}%
                </span>
              </div>
            )}
            {chamber.phase === "saturated" && (
              <p className="temp-hint warn">Saturated — empty this chamber.</p>
            )}
            {/* one to recharge it, one to drain it — the two things an
                absorption chamber ever does outside its own gas cycle */}
            <div className="btn-row">
              <Action
                busy={filling}
                busyLabel={id === "W" ? "Filling…" : "Recharging…"}
                stopLabel="Stop charge"
                onStop={() => s.haltChamber(id)}
                disabled={draining}
                locked={automate}
                onClick={() => (id === "W" ? s.fillColumn() : s.chargeChamber(id))}
              >
                {id === "W" ? "Refill" : "Recharge"}
              </Action>
              <Action
                tone="empty"
                busy={draining}
                busyLabel="Draining…"
                stopLabel="Stop drain"
                onStop={() => s.haltChamber(id)}
                disabled={chamber.fill <= 0}
                locked={automate}
                onClick={() => s.emptyChamber(id)}
              >
                {id === "W" ? "Empty" : compact ? "Drain" : "Drain to storage"}
              </Action>
            </div>
          </div>
        );
      })}

      <div className="chamber-card">
        <div className="chamber-head">
          <span className="chamber-name">Solvent Storage</span>
          <span className="fill-value">{(storageFill * 100).toFixed(0)}%</span>
        </div>
        <Meter value={storageFill} />
        <Action
          busy={storageDraining || transferQueued}
          busyLabel={transferQueued ? "Transfer queued…" : "Transferring…"}
          stopLabel="Stop transfer"
          onStop={s.stopStorageTransfer}
          disabled={storageFill <= 0}
          locked={automate}
          onClick={s.transferStorage}
        >
          {compact ? "Transfer" : "Transfer to decomposition"}
        </Action>
      </div>

      <div className="chamber-card">
        <div className="chamber-head">
          <span className="chamber-name">Decomposition Chamber</span>
          <span className={`phase-badge ${decompMotor ? "active" : "standby"}`}>
            stirrer {decompMotor ? "running" : "stopped"}
          </span>
        </div>
        <Meter value={decompFill} />
        {/* the motor is what decomposes the batch and the transfer is what
            sends it on — two separate acts, so two separate buttons */}
        <div className="btn-row">
          <Action
            tone={decompMotor ? "empty" : "act"}
            disabled={decompFill <= 0}
            locked={automate}
            onClick={() => s.setDecompMotor(!decompMotor)}
          >
            {decompMotor ? "Stop motor" : "Start motor"}
          </Action>
          <Action
            busy={decompDraining}
            busyLabel="Transferring…"
            stopLabel="Stop transfer"
            onStop={s.stopDecompTransfer}
            disabled={decompFill <= 0}
            locked={automate}
            onClick={s.emptyDecomp}
          >
            {compact ? "Transfer" : "Transfer to filtration"}
          </Action>
        </div>
      </div>

      <div className="chamber-card">
        <div className="chamber-head">
          <span className="chamber-name">Filtration System</span>
          <span className="fill-value">
            {(filtrationFill * 100).toFixed(0)}%
          </span>
        </div>
        <Meter value={filtrationFill} tone="sat" />
        <Action
          busy={filtrationRunning}
          busyLabel="Separating…"
          stopLabel="Stop separating"
          onStop={s.stopFiltration}
          disabled={filtrationFill <= 0}
          locked={automate}
          onClick={s.runFiltration}
        >
          {compact ? "Separate" : "Separate batch"}
        </Action>
      </div>

      <div className="chamber-card">
        <div className="chamber-head">
          <span className="chamber-name">Spent Solvent Treatment</span>
          <span className="fill-value">{(treatmentFill * 100).toFixed(0)}%</span>
        </div>
        <Meter value={treatmentFill} tone="sat" />
        <Action
          busy={treatmentDraining}
          busyLabel="Transferring…"
          stopLabel="Stop transfer"
          onStop={s.stopTreatmentTransfer}
          disabled={treatmentFill <= 0 || inventoryFill >= INVENTORY_FULL}
          locked={automate}
          onClick={s.drainTreatment}
        >
          {compact ? "Transfer" : "Transfer to inventory"}
        </Action>
      </div>

      <div className="chamber-card">
        <div className="chamber-head">
          <span className="chamber-name">Solvent Inventory</span>
          <span className="fill-value">{(inventoryFill * 100).toFixed(0)}%</span>
        </div>
        <Meter value={inventoryFill} />
        <p className="temp-hint">
          The only tank the chambers are charged from.
        </p>
        <Action
          busy={makeupRunning}
          busyLabel="Topping up…"
          stopLabel="Stop top-up"
          onStop={s.stopMakeup}
          disabled={inventoryFill >= INVENTORY_FULL}
          locked={automate}
          onClick={s.addMakeup}
        >
          {compact ? "Top up" : "Add make-up solvent"}
        </Action>
      </div>

      <p className="panel-footer">
        Flue stack <em>or</em> air capture fans → water column → working
        absorption chamber → storage → decomposition → filtration → treatment →
        inventory, and back to the chambers.
      </p>
    </div>
  );
}
