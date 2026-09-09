const SECTORS = [
  {
    id: "cement",
    headline: "Cement can't decarbonize its way out with fuel switching alone",
    lede: "Cement is one of the hardest sectors to abate — most of its CO\u2082 comes from the chemistry of making clinker, not the fuel that heats the kiln. It needs an endpoint solution, not just efficiency gains.",
    stats: [
      { value: "~7-8%", label: "of global CO\u2082 emissions come from cement production" },
      { value: "~60%", label: "of a cement plant\u2019s CO\u2082 is unavoidable process emissions from limestone calcination" },
      { value: "2070", label: "India\u2019s Net Zero target \u2014 with cement named a priority hard-to-abate sector" },
    ],
    reasons: [
      {
        title: "Regulation is closing the gap",
        icon: "\uD83D\uDEE1\uFE0F",
        body: "New emissions mandates aligned with India\u2019s Net Zero 2070 roadmap are creating immediate compliance demand across thermal power, steel, cement and chemicals \u2014 the largest unaddressed industrial emitters.",
      },
      {
        title: "No profitable removal technology exists",
        icon: "\u2699\uFE0F",
        body: "Available CCUS options are cost-heavy, require geological storage or transport, and generate no revenue \u2014 making adoption difficult for cement producers operating on thin margins.",
      },
    ],
  },
];

export function TheProblemSlide() {
  return (
    <div className="slide problem-slide">
      <div className="slide-ambient" aria-hidden="true">
        <div className="slide-blob slide-blob-green" />
        <div className="slide-blob slide-blob-orange" />
      </div>
      <div className="slide-scroll">
        {SECTORS.map((sector, idx) => (
          <section key={sector.id} className="problem-section">
            {idx === 0 && (
              <header className="slide-header">
                <p className="slide-eyebrow">02 / The Problem</p>
                <h1 className="slide-title">{sector.headline}</h1>
                <p className="slide-subtitle">{sector.lede}</p>
              </header>
            )}

            {idx > 0 && (
              <header className="slide-header problem-section-header">
                <p className="slide-eyebrow">{sector.id.toUpperCase()}</p>
                <h2 className="slide-title problem-section-title">
                  {sector.headline}
                </h2>
                <p className="slide-subtitle">{sector.lede}</p>
              </header>
            )}

            <div className="stat-strip">
              {sector.stats.map((s) => (
                <div className="stat-tile" key={s.label}>
                  <span className="stat-value">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </div>

            <h2 className="section-heading">Why Now</h2>
            <div className="problem-reasons">
              {sector.reasons.map((r) => (
                <div className="problem-reason-card" key={r.title}>
                  <div className="problem-reason-icon" aria-hidden="true">
                    {r.icon}
                  </div>
                  <div>
                    <h3>{r.title}</h3>
                    <p>{r.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
