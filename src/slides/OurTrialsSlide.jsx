const HIGHLIGHTS = [
  { value: "99%", label: "CO₂ absorption efficiency — Trial 1" },
  { value: "3", label: "Validation trials performed at NCCBM" },
  { value: "8.5 hrs", label: "Continuous operation, Trial 1" },
  { value: "40 L", label: "Solvent charge, Trial 3 — 2× Trials 1 & 2" },
];

const TRIALS = [
  {
    no: "Trial 1",
    status: "Completed",
    statusClass: "done",
    meta: [
      { label: "Solvent used", value: "20 L" },
      { label: "CO₂ sources", value: "Gasifier (~12%), CO₂ cylinder (~99%)" },
      { label: "Duration", value: "8.5 hours" },
    ],
    columns: ["Reading No.", "Time", "CO₂ Inlet (%)", "CO₂ Outlet (%)"],
    rows: [
      ["1 (Gasifier)", "10:30 AM", "12.39%", "0.01%"],
      ["2 (Gasifier)", "11:30 AM", "9.09%", "0.06%"],
      ["3 (CO₂ Cylinder)", "1:00 PM", "99.91%", "9.01%"],
      ["4 (CO₂ Cylinder)", "2:00 PM", "99.97%", "14.32%"],
      ["5 (CO₂ Cylinder)", "3:00 PM", "99.89%", "29.25%"],
      ["6 (CO₂ Cylinder)", "4:00 PM", "99.93%", "31.80%"],
    ],
    summary:
      "The solvent was tested against two CO₂ sources — a cylinder at ~99% CO₂ and a gasifier stream at ~12% CO₂. The trial ran for 8.5 hours and achieved a CO₂ absorption efficiency of approximately 99%.",
  },
  {
    no: "Trial 2",
    status: "Completed",
    statusClass: "done",
    meta: [
      { label: "Solvent used", value: "20 L" },
      { label: "CO₂ sources", value: "Gasifier, CO₂ cylinder (same range as Trial 1)" },
      { label: "Cycle", value: "Fresh batch, repeat of Trial 1" },
    ],
    columns: ["Reading No.", "Time", "CO₂ Inlet (%)", "CO₂ Outlet (%)"],
    rows: [
      ["1", "11:30 AM", "13.24%", "0.02%"],
      ["2", "1:30 PM", "11.29%", "0.21%"],
      ["3", "2:30 PM", "9.28%", "0.89%"],
      ["4", "3:30 PM", "8.56%", "3.02%"],
      ["5", "4:30 PM", "9.75%", "7.71%"],
    ],
    summary:
      "The Trial 1 cycle was repeated with a fresh 20-litre solvent batch, against the same CO₂ sources and concentration ranges. Readings confirmed consistent, repeatable absorption performance across the batch.",
  },
  {
    no: "Trial 3",
    status: "Ongoing",
    statusClass: "live",
    meta: [
      { label: "Solvent used", value: "40 L" },
      { label: "CO₂ sources", value: "CO₂ cylinder (~99%) — same parameters" },
      { label: "Duration", value: "Extended continuous run, not yet complete" },
    ],
    columns: ["Reading No.", "Time", "CO₂ Inlet (%)", "CO₂ Outlet (%)"],
    rows: [
      ["1", "12:30 PM", "99.91%", "0.00%"],
      ["2", "1:30 PM", "99.37%", "0.01%"],
      ["3", "2:30 PM", "99.48%", "0.04%"],
      ["4", "3:30 PM", "99.47%", "0.00%"],
      ["5", "4:00 PM", "99.38%", "0.01%"],
    ],
    summary:
      "40 litres of solvent — double the volume of Trials 1 and 2 — with all other parameters unchanged. This is a continuous, extended-duration run that is currently ongoing.",
  },
];

function TrialCard({ trial }) {
  return (
    <article className="trial-card">
      <div className="trial-card-head">
        <h2 className="trial-card-title">{trial.no}</h2>
        <span className={`trial-status trial-status-${trial.statusClass}`}>
          {trial.status}
        </span>
      </div>

      <dl className="trial-meta">
        {trial.meta.map((m) => (
          <div className="trial-meta-item" key={m.label}>
            <dt>{m.label}</dt>
            <dd>{m.value}</dd>
          </div>
        ))}
      </dl>

      <div className="trial-table-wrap">
        <table className="finance-table trial-table">
          <thead>
            <tr>
              {trial.columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trial.rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j} className={j >= 2 ? "trial-pct" : undefined}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="trial-summary">{trial.summary}</p>
    </article>
  );
}

export function OurTrialsSlide() {
  return (
    <div className="slide trials-slide">
      <div className="slide-ambient" aria-hidden="true">
        <div className="slide-blob slide-blob-green" />
        <div className="slide-blob slide-blob-orange" />
      </div>
      <div className="slide-scroll">
        <header className="slide-header">
          <p className="slide-eyebrow">06 / Our Trials</p>
          <h1 className="slide-title">CO₂ absorption validation trials</h1>
          <p className="slide-subtitle">
            In July &amp; August, three validation trials were performed at
            NCCBM — of which the third is still ongoing. Every trial measured
            CO₂ inlet vs. outlet across gasifier and cylinder sources.
          </p>
        </header>

        <div className="stat-strip stat-strip-3">
          {HIGHLIGHTS.map((h) => (
            <div className="stat-tile" key={h.label}>
              <span className="stat-value">{h.value}</span>
              <span className="stat-label">{h.label}</span>
            </div>
          ))}
        </div>

        <div className="trial-grid">
          {TRIALS.map((t) => (
            <TrialCard trial={t} key={t.no} />
          ))}
        </div>
      </div>
    </div>
  );
}