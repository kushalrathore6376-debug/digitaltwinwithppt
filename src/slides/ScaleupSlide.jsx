const PHASES = [
  {
    n: "01",
    name: "Demonstration",
    scale: "Proof of process",
    metric: "45 days",
    sub: "₹1 Cr capex — bench-scale validation of the capture & decomposition process",
    growth: null,
  },
  {
    n: "02",
    name: "Commercial pilot",
    scale: "100 kg/day",
    metric: "1 year, continuous",
    sub: "Sustained run to prove commercial-grade output and plant uptime",
    growth: null,
  },
  {
    n: "03",
    name: "Commercial",
    scale: "1 TPD",
    metric: "First revenue plant",
    sub: "First revenue-generating plant at commercial throughput",
    growth: "10× Phase 2",
  },
  {
    n: "04",
    name: "Scale-up",
    scale: "10 TPD",
    metric: "Regional rollout",
    sub: "Multi-line facility, regional rollout across partner sites",
    growth: "10× Phase 3",
  },
  {
    n: "05",
    name: "Full scale",
    scale: "100 TPD",
    metric: "Flagship deployment",
    sub: "Industrial-scale footprint at flagship deployment sites",
    growth: "10× Phase 4",
  },
];

// Scale-up roadmap — a connected line of numbered nodes (the same gradient
// ring the deck already uses for team photos) leading into a row of cards,
// rather than a bar chart. Nothing else in the deck plots data as a chart —
// every other slide states its numbers as a big gradient figure inside a
// card — so the roadmap keeps that vocabulary instead of introducing a new
// one just for this slide.
export function ScaleupSlide() {
  return (
    <div className="slide scaleup-slide">
      <div className="slide-ambient" aria-hidden="true">
        <div className="slide-blob slide-blob-green" />
        <div className="slide-blob slide-blob-orange" />
      </div>
      <div className="slide-scroll">
        <header className="slide-header">
          <p className="slide-eyebrow">04 / Plant Scale-Up</p>
          <h1 className="slide-title">
            From pilot to 100 TPD — five phases, each a 10&times; leap
          </h1>
          <p className="slide-subtitle">
            A staged roadmap from bench-scale demonstration to full
            industrial throughput. Every commercial phase scales exactly
            10&times; on the one before it — 1 tonne, to 10, to 100 tonnes
            of CO&#8322; processed a day.
          </p>
        </header>

        <div className="scaleup-highlight">
          <span className="scaleup-highlight-from">100 kg/day</span>
          <span className="scaleup-highlight-arrow" aria-hidden="true">
            →
          </span>
          <span className="scaleup-highlight-to">100 TPD</span>
          <span className="scaleup-highlight-tag">1,000&times; throughput across 4 commercial phases</span>
        </div>

        <div className="scaleup-nodes" aria-hidden="true">
          {PHASES.map((p) => (
            <div className="scaleup-node-cell" key={p.n}>
              <span className="scaleup-node">{p.n}</span>
            </div>
          ))}
        </div>

        <div className="scaleup-grid">
          {PHASES.map((p) => (
            <div className="scaleup-card" key={p.n}>
              <span className="scaleup-phase-badge">Phase {p.n}</span>
              <span className="stat-value scaleup-scale">{p.scale}</span>
              <h3>{p.name}</h3>
              {p.growth ? (
                <span className="growth-pill">
                  <span className="growth-pill-arrow" aria-hidden="true">
                    ▲
                  </span>
                  {p.growth}
                </span>
              ) : (
                <span className="growth-pill growth-pill-muted">{p.metric}</span>
              )}
              <p className="scaleup-sub">{p.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
