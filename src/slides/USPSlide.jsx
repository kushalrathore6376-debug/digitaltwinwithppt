const STEPS = [
  {
    num: "1",
    title: "Capture",
    color: "var(--tx-orange)",
    desc: "Proprietary solvent absorbs CO\u2082 straight from live flue gas or process streams \u2014 up to 99% efficiency, from 12% dilute gasifier gas to 99% pure sources.",
  },
  {
    num: "2",
    title: "Decompose",
    color: "var(--gold)",
    desc: "Absorbed CO\u2082 is broken down into 95%-graphitic solid carbon and oxygen gas \u2014 not stored underground, but turned into two sellable outputs.",
  },
  {
    num: "3",
    title: "Upgrade",
    color: "var(--tx-green)",
    desc: "The graphite is processed further into rGO, carbon nanotubes, graphene oxide and graphene coatings \u2014 stacking margin on top of margin from one ton of carbon.",
  },
];

const OUTPUTS = [
  {
    color: "#F07818",
    title: "Graphite",
    badge: "PRIMARY",
    desc: "95%-graphitic solid decomposed directly from captured CO\u2082 \u2014 the primary product, sold before any credit is issued.",
  },
  {
    color: "#0072CE",
    title: "Oxygen",
    badge: "CO-PRODUCT",
    desc: "Released as a co-product of decomposition \u2014 a second buyer on the same reaction, at zero extra capture cost.",
  },
  {
    color: "#128A08",
    title: "Graphene",
    badge: "UPGRADE",
    desc: "Graphite upgraded into rGO, CNTs, graphene oxide & coatings \u2014 the same ton of carbon monetized more than once.",
  },
  {
    color: "#6E675E",
    title: "Carbon Credits",
    badge: "BONUS",
    desc: "9 credits per ton graphite.",
  },
];

export function USPSlide() {
  return (
    <div className="slide usp-slide">
      <div className="slide-ambient" aria-hidden="true">
        <div className="slide-blob slide-blob-orange" />
        <div className="slide-blob slide-blob-green" />
      </div>
      <div className="slide-scroll">
        <header className="slide-header">
          <p className="slide-eyebrow">04 / Our USP</p>
          <h1 className="slide-title">
            Carbon capture that pays for itself{" "}
            <span className="usp-highlight">before a single carbon credit is sold.</span>
          </h1>
          <p className="slide-subtitle">
            Most CCUS sells the absence of emissions{" \u2014"} a revenue line that only exists
            because carbon has a price today, and disappears if that price falls.
            <strong> TraceXero decomposes captured CO{"\u2082"} directly into graphite and
            oxygen, then upgrades that graphite into graphene</strong>{" \u2014"} so the same
            carbon atom is sold as a physical product before it{"\u2019"}s ever counted as a credit.
          </p>
        </header>

        <div className="usp-pipeline">
          {STEPS.map((s, i) => (
            <div className="usp-pipeline-stage" key={s.num}>
              <div className="usp-step" style={{ "--step-accent": s.color }}>
                <div className="usp-step-glow" aria-hidden="true" />
                <div className="usp-step-num">{s.num}</div>
                <h3 className="usp-step-title">{s.title}</h3>
                <p className="usp-step-desc">{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="usp-pipeline-arrow" aria-hidden="true">
                  <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
                    <path d="M0 12h32M26 5l8 7-8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="usp-divider" aria-hidden="true">
          <span className="usp-divider-label">OUTPUTS</span>
        </div>

        <div className="usp-outputs">
          {OUTPUTS.map((o) => (
            <div className="usp-output-card" key={o.title} style={{ "--card-accent": o.color }}>
              <div className="usp-output-accent" aria-hidden="true" />
              <span className="usp-output-badge">{o.badge}</span>
              <h4 className="usp-output-title">{o.title}</h4>
              <p className="usp-output-desc">{o.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
