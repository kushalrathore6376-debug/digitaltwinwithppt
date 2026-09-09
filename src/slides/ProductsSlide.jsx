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

const STATS = [
  { value: "100 kg", label: "CO\u2082 processing / day commercial pilot" },
  { value: "~20 kg", label: "High-Purity Nano-Graphite" },
  { value: "~60%", label: "Lower capture cost vs. international competitors" },
  { value: "0%", label: "Waste stream \u2014 complete carbon utilisation" },
  {
    value: "50 Kg",
    label: "Pure Oxygen stream \u2014 directly usable in industries",
  },
  { value: ">2Kg", label: "Industrial grade to high-end Graphene" },
  {
    value: "1 credit",
    label: "Carbon credit every 10 days at smallest commercial scale",
  },
  {
    value: "World\u2019s 1ST",
    label: "Technology breaking CO\u2082 apart under ambient conditions",
  },
];

const PRODUCTS = [
  {
    name: "Graphitic carbon",
    image: "/products/graphite-flakes-500x500.jpg",
    alt: "Layered graphite flakes",
    body: "Decomposed directly from flue-gas CO\u2082 and confirmed by XRD, XPS and Raman analysis. The residual fraction after graphene extraction \u2014 still a saleable material in its own right.",
    tags: ["Electros", "Batteries", "Automotive", "Metallurgy"],
  },
  {
    name: "Oxygen",
    image: "/products/oxygen.png",
    alt: "Glowing O2 molecule",
    body: "Recovered as a clean by-product of the same decomposition reaction that yields carbon \u2014 no hazardous waste, and a second stream of value from every kilogram of CO\u2082 processed.",
    tags: [
      "Improved air quality",
      "Industrial combustion",
      "Heat recovery",
      "Reduced fuel burn",
    ],
  },
  {
    name: "Graphene",
    image: "/products/graphene.png",
    alt: "Hexagonal graphene lattice",
    body: "The primary revenue driver. Captured carbon is exfoliated by probe-sonication into 100\u2013200 nm graphene nanosheets, sold across the 5,000\u201340,000 \u20B9/kg price spectrum.",
    tags: [
      "Paint & coatings",
      "Composites & polymers",
      "Batteries",
      "Solar cells",
      "Supercapacitors",
    ],
  },
];

const FINANCE_STATS = [
  {
    value: "\u20B93.5 Cr",
    label: "CAPEX \u2014 full facility setup & commissioning",
  },
  { value: "\u20B91.5 Cr", label: "Annual plant opex" },
  { value: "\u20B913.74 Cr", label: "Annual revenue, single 100 kg/day plant" },
];

const REVENUE_ROWS = [
  { stream: "Raw FLG sales", value: "1.68" },
  { stream: "Raw MLG sales", value: "3.36" },
  { stream: "Nano-graphite sales", value: "1.50" },
  { stream: "Graphene-enhanced coatings", value: "7.20" },
];

export function ProductsSlide() {
  return (
    <div className="slide products-slide">
      <div className="slide-ambient" aria-hidden="true">
        <div className="slide-blob slide-blob-orange" />
        <div className="slide-blob slide-blob-green" />
      </div>
      <div className="slide-scroll">
        <header className="slide-header">
          <p className="slide-eyebrow">03 / USPs &amp; Products</p>
          <h1 className="slide-title">
            Carbon capture that pays for itself{" "}
            <span className="usp-highlight">
              before a single carbon credit is sold.
            </span>
          </h1>
          <p className="slide-subtitle">
            Most CCUS sells the absence of emissions. TraceXero decomposes
            captured CO&#8322; directly into graphite and oxygen, then upgrades
            that graphite into graphene &mdash; so the same carbon atom is sold
            as a physical product before it&rsquo;s ever counted as a credit.
          </p>
        </header>

        {/* process pipeline */}
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
                    <path
                      d="M0 12h32M26 5l8 7-8 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
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
            <div
              className="usp-output-card"
              key={o.title}
              style={{ "--card-accent": o.color }}
            >
              <div className="usp-output-accent" aria-hidden="true" />
              <span className="usp-output-badge">{o.badge}</span>
              <h4 className="usp-output-title">{o.title}</h4>
              <p className="usp-output-desc">{o.desc}</p>
            </div>
          ))}
        </div>

        {/* key numbers */}
        <div className="stat-strip">
          {STATS.map((s) => (
            <div className="stat-tile" key={s.label}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* product cards */}
        <h2 className="section-heading">Products</h2>
        <div className="product-grid">
          {PRODUCTS.map((p) => (
            <article className="product-card" key={p.name}>
              <div className="product-photo">
                <img src={p.image} alt={p.alt} />
              </div>
              <h3>{p.name}</h3>
              <p>{p.body}</p>
              <p className="product-applications-heading">Applications</p>
              <ul className="product-tags">
                {p.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* finances */}
        {/* <h2 className="section-heading">Finances</h2>
        <p className="slide-subtitle finance-lede">
          Unit economics for a single 100 kg/day plant &mdash; steady-state,
          20&times; pilot scale.
        </p>
        <div className="stat-strip">
          {FINANCE_STATS.map((s) => (
            <div className="stat-tile" key={s.label}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

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
        </div> */}
      </div>
    </div>
  );
}
