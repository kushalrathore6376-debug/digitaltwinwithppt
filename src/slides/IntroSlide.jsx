const PILLARS = [
  {
    title: "TraceXero advantage",
    body:
      "A patent-pending process that needs only 80–90°C to absorb and decompose CO₂ — a 60% lower capture cost than international competitors.",
  },
  {
    title: "Beyond carbon capture",
    body:
      "Not just storage — permanent removal. Captures CO₂, SOx, NOx and particulate matter on-site, with no storage facility or transportation required.",
  },
  {
    title: "Waste to value",
    body:
      "Converts CO₂ into pure graphitic carbon and oxygen. No hazardous waste, and a by-product stream that generates revenue instead of cost.",
  },
  {
    title: "Economic advantage",
    body:
      "Generates carbon credits while cutting opex by 50% through solvent recyclability and reusability — decarbonisation that pays for itself.",
  },
];

const WHY_NOW = [
  { value: "75%", label: "Of industrial emissions from thermal power, steel, cement & chemicals remain unaddressed" },
  { value: "60%", label: "Lower capture cost than international competitors — no scalable, profitable alternative exists today" },
  { value: "2070", label: "India's Net Zero target — new mandates are creating immediate demand for this technology" },
];

// Cover slide — first thing a viewer sees. Clean, brand-led: white
// background, TraceXero's own orange and green doing the accenting, in
// keeping with the logo mark.
export function IntroSlide({ onExplore }) {
  return (
    <div className="slide intro-slide">
      <div className="intro-backdrop" aria-hidden="true">
        <div className="intro-blob intro-blob-orange" />
        <div className="intro-blob intro-blob-green" />
      </div>

      <div className="intro-content">
        <div className="intro-brand">
          <img src="/logo.svg" alt="" className="intro-logo" />
          <div className="intro-wordmark">
            <span className="intro-wordmark-line">
              <span className="intro-wordmark-trace">TRACE</span>
              <span className="intro-wordmark-xero">XERO</span>
            </span>
            <span className="intro-wordmark-tag">POLLUTANT TO COMMODITY</span>
          </div>
        </div>

        <p className="intro-eyebrow">
          India's first carbon-capture-to-graphene technology
        </p>

        <h1 className="intro-headline">
          Achieve <span className="hl-green">net-zero</span> emissions with{" "}
          <span className="hl-orange">Trace</span>
          <span className="hl-green">Xero</span>
        </h1>

        <p className="intro-lede">
          Converting industrial flue gas into a valuable commodity — turning
          pollution into profit through advanced carbon capture &amp;
          decomposition.
        </p>

        <div className="intro-actions">
          <button type="button" className="intro-cta" onClick={onExplore}>
            Explore the digital twin <span aria-hidden="true">→</span>
          </button>
          <span className="intro-locations">
            Jaipur · Gurgaon · Faridabad · Kolkata
          </span>
        </div>

        <section className="intro-section">
          <h2 className="intro-section-heading">About TraceXero</h2>
          <p className="intro-section-lede">
            We partner with industries to build a climate-positive world —
            carbon capture &amp; removal, plus direct air capture, engineered
            so decarbonisation is something a plant can afford to run every
            day, not just a compliance line item.
          </p>
          <div className="pillar-grid">
            {PILLARS.map((p) => (
              <div className="pillar-card" key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="intro-section">
          <h2 className="intro-section-heading">Why now</h2>
          <div className="stat-strip stat-strip-3">
            {WHY_NOW.map((s) => (
              <div className="stat-tile" key={s.label}>
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="intro-footer">
          <div className="intro-footer-block">
            <h2>Industrial Decarbonisation</h2>
            <p>Bio-Energy Carbon Capture and Sequestration</p>
            <p>Direct Air Carbon Capture</p>
          </div>

          <div className="intro-footer-block intro-sdg">
            <h2>UN SDG alignment</h2>
            <ul className="sdg-grid">
              <li className="sdg-tile">
                <img
                  className="sdg-icon"
                  src="/sdg/sdg-09.png"
                  alt="UN SDG 9: Industry, Innovation and Infrastructure"
                />
              </li>
              <li className="sdg-tile">
                <img
                  className="sdg-icon"
                  src="/sdg/sdg-12.png"
                  alt="UN SDG 12: Responsible Consumption and Production"
                />
              </li>
              <li className="sdg-tile">
                <img
                  className="sdg-icon"
                  src="/sdg/sdg-13.png"
                  alt="UN SDG 13: Climate Action"
                />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
