const FINANCE_STATS = [
  { value: "\u20B93.5 Cr", label: "CAPEX \u2014 full facility setup & commissioning" },
  { value: "\u20B91.5 Cr", label: "Annual plant opex" },
  { value: "\u20B913.74 Cr", label: "Annual revenue, single 100 kg/day plant" },
];

const REVENUE_ROWS = [
  { stream: "Raw FLG sales", value: "1.68" },
  { stream: "Raw MLG sales", value: "3.36" },
  { stream: "Nano-graphite sales", value: "1.50" },
  { stream: "Graphene-enhanced coatings", value: "7.20" },
];

const PHASES = [
  {
    n: "01",
    tag: "NOW",
    name: "Demonstration",
    capacity: "20 kg/day",
    cost: "₹50 Lakhs",
    duration: "3 months",
    color: "var(--tx-orange)",
    accent: "#f07818",
    description:
      "On-site demonstration at partner facility — proving the capture-to-graphite process works on live flue gas at industrial conditions.",
    milestones: [
      "Live flue gas capture runs",
      "Graphite & oxygen output validated",
      "Performance data for Phase 2",
    ],
  },
  {
    n: "02",
    tag: "NEXT",
    name: "Commercial Pilot",
    capacity: "100 kg/day",
    cost: "₹4.5 Crores",
    duration: "1 year",
    color: "var(--gold)",
    accent: "#c8932e",
    description:
      "Full commercial pilot — 3 months of demonstration followed by sustained 100 kg/day operations, proving commercial-grade uptime and output.",
    milestones: [
      "100 kg/day continuous operations",
      "Revenue-grade graphite output",
      "Carbon credit eligibility confirmed",
    ],
  },
  {
    n: "03",
    tag: "SCALE",
    name: "1 TPD Scale-Up",
    capacity: "1 TPD",
    cost: "₹10 Crores",
    duration: "1 year",
    color: "var(--tx-green)",
    accent: "#128a08",
    description:
      "First revenue plant at 1 tonne per day — running for a full year, then scaling further. The step that turns a proven process into a business.",
    milestones: [
      "Full product revenue streams",
      "Carbon credit generation at scale",
      "Blueprint for 10+ TPD rollout",
    ],
  },
];

function PhaseCard({ phase }) {
  return (
    <div className="ps-card" style={{ "--phase-accent": phase.accent }}>
      <div className="ps-card-glow" aria-hidden="true" />
      <div className="ps-card-top">
        <span className="ps-phase-badge">Phase {phase.n}</span>
        <span className="ps-tag" style={{ background: phase.accent }}>
          {phase.tag}
        </span>
      </div>

      <h3 className="ps-card-name">{phase.name}</h3>

      <div className="ps-card-metrics">
        <div className="ps-metric">
          <span className="ps-metric-value">{phase.cost}</span>
          <span className="ps-metric-label">Investment</span>
        </div>
        <div className="ps-metric">
          <span className="ps-metric-value ps-metric-cap">
            {phase.capacity}
          </span>
          <span className="ps-metric-label">CO₂ Removal</span>
        </div>
        <div className="ps-metric">
          <span className="ps-metric-value">{phase.duration}</span>
          <span className="ps-metric-label">Duration</span>
        </div>
      </div>

      <p className="ps-card-desc">{phase.description}</p>

      <ul className="ps-milestones">
        {phase.milestones.map((m) => (
          <li key={m}>
            <span className="ps-check" aria-hidden="true">
              ✓
            </span>
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GrowthArrow({ from, to, label }) {
  return (
    <div className="ps-growth" aria-label={label}>
      <div className="ps-growth-line" aria-hidden="true" />
      <div className="ps-growth-pill">
        <span className="ps-growth-arrow" aria-hidden="true">
          ▲
        </span>
        {label}
      </div>
      <div className="ps-growth-line" aria-hidden="true" />
    </div>
  );
}

export function ScaleupSlide() {
  return (
    <div className="slide scaleup-slide">
      <div className="slide-ambient" aria-hidden="true">
        <div className="slide-blob slide-blob-green" />
        <div className="slide-blob slide-blob-orange" />
      </div>
      <div className="slide-scroll">
        <header className="slide-header">
          <p className="slide-eyebrow">05 / Project Roadmap and Scale-up </p>
          <h1 className="slide-title">
            1 TPD carbon removal in 2 years — ₹15 Crores, three phases
          </h1>
          <p className="slide-subtitle">
            A staged path from on-site demonstration to a revenue-generating
            1-tonne-per-day plant. Each phase de-risks the next, so capital is
            deployed against proven results, not projections.
          </p>
        </header>

        {/* headline banner */}
        <div className="ps-banner">
          <div className="ps-banner-stat">
            <span className="ps-banner-value">₹15 Cr</span>
            <span className="ps-banner-label">Total Investment</span>
          </div>
          <div className="ps-banner-divider" aria-hidden="true" />
          <div className="ps-banner-stat">
            <span className="ps-banner-value">1 TPD</span>
            <span className="ps-banner-label">Target Capacity</span>
          </div>
          <div className="ps-banner-divider" aria-hidden="true" />
          <div className="ps-banner-stat">
            <span className="ps-banner-value">2 Years</span>
            <span className="ps-banner-label">End-to-End</span>
          </div>
        </div>

        {/* connected phase cards */}
        <div className="ps-flow">
          <PhaseCard phase={PHASES[0]} />
          <GrowthArrow from="20 kg/day" to="100 kg/day" label="5× capacity" />
          <PhaseCard phase={PHASES[1]} />
          <GrowthArrow from="100 kg/day" to="1 TPD" label="10× capacity" />
          <PhaseCard phase={PHASES[2]} />
        </div>

        {/* combined timeline bracket: Phase 1 + 2 = 1 year */}
        <div className="ps-bracket" aria-hidden="true">
          <div className="ps-bracket-wrap">
            <span className="ps-bracket-end" />
            <span className="ps-bracket-segment ps-bracket-seg-a" />
            <span className="ps-bracket-mid">
              <span className="ps-bracket-mid-dot" />
            </span>
            <span className="ps-bracket-segment ps-bracket-seg-b" />
            <span className="ps-bracket-end" />
          </div>
          <span className="ps-bracket-pill">
            <span className="ps-bracket-pill-icon">⏱</span>
            <span className="ps-bracket-pill-text">
              Phase 1 + 2 = <strong>1 year</strong>
            </span>
            <span className="ps-bracket-pill-sub">
              3 months demo → 9 months at 100 kg/day
            </span>
          </span>
        </div>

        {/* bottom context */}
        <div className="ps-context">
          <div className="ps-context-card">
            <span className="ps-context-icon" aria-hidden="true">
              ↗
            </span>
            <div>
              <h4>Beyond Phase 3</h4>
              <p>
                After a year of 1 TPD operations, TraceXero targets a further
                10× scale-up — multi-line regional deployments at partner sites
                across India.
              </p>
            </div>
          </div>
          <div className="ps-context-card">
            <span className="ps-context-icon" aria-hidden="true">
              ◆
            </span>
            <div>
              <h4>De-Risked Execution</h4>
              <p>
                Each phase validates the technology at a larger scale before
                the next tranche of capital is committed — no step depends on
                an unproven assumption.
              </p>
            </div>
          </div>
        </div>

        {/* unit economics */}
        <div className="scaleup-finances">
          <h2 className="section-heading">Potential Revenue Stream for 100 kg/day Plant</h2>
          <p className="slide-subtitle finance-lede">
            Unit economics for a single 100 kg/day plant &mdash; steady-state,
            5 Times of Demonstration Scale.
          </p>
          {/* <div className="stat-strip">
            {FINANCE_STATS.map((s) => (
              <div className="stat-tile" key={s.label}>
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div> */}

          <div className="finance-table-wrap">
            <table className="finance-table">
              <thead>
                <tr>
                  <th>Revenue stream</th>
                  <th>Annual revenue (&#x20B9; Cr)</th>
                </tr>
              </thead>
              <tbody>
                {REVENUE_ROWS.map((r) => (
                  <tr key={r.stream}>
                    <td>{r.stream}</td>
                    <td>{r.value}</td>
                  </tr>
                ))}
                <tr className="finance-total">
                  <td>Total revenue</td>
                  <td>13.74</td>
                </tr>
              </tbody>
            </table>
            <p className="finance-note">
              Replicated across 10 plants: ~&#x20B9;137.4 Cr annual revenue and
              ~&#x20B9;102.4 Cr EBITDA &mdash; revenue scales linearly with CO&#8322; capture
              capacity, each plant a self-contained profit centre.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
