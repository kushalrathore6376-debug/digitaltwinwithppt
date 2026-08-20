const STATS = [
  { value: "100 kg", label: "CO₂ processed per day, pilot scale" },
  { value: "2 kg", label: "High-grade graphene produced per day" },
  { value: "60%", label: "Lower capture cost vs. international competitors" },
  { value: "0%", label: "Waste stream — full carbon utilisation" },
];

const PRODUCTS = [
  {
    name: "Graphene",
    image: "/products/graphene.png",
    alt: "Hexagonal graphene lattice",
    body:
      "The primary revenue driver. Captured carbon is exfoliated by probe-sonication into 100–200 nm graphene nanosheets, sold across the 5,000–40,000 ₹/kg price spectrum.",
    tags: ["Paint & coatings", "Composites & polymers", "Batteries", "Solar cells", "Supercapacitors"],
  },
  {
    name: "Graphitic carbon",
    image: "/products/graphite-flakes-500x500.jpg",
    alt: "Layered graphite flakes",
    body:
      "Decomposed directly from flue-gas CO₂ and confirmed by XRD, XPS and Raman analysis. The residual fraction after graphene extraction — still a saleable material in its own right.",
    tags: ["Coatings", "Batteries", "Construction additives", "Metallurgy"],
  },
  {
    name: "Oxygen",
    image: "/products/oxygen.png",
    alt: "Glowing O2 molecule",
    body:
      "Recovered as a clean by-product of the same decomposition reaction that yields carbon — no hazardous waste, and a second stream of value from every kilogram of CO₂ processed.",
    tags: ["Improved air quality", "Industrial combustion", "Heat recovery", "Reduced fuel burn"],
  },
];

const FINANCE_STATS = [
  { value: "₹3.5 Cr", label: "CAPEX — full facility setup & commissioning" },
  { value: "₹1.5 Cr", label: "Annual plant opex" },
  { value: "₹13.74 Cr", label: "Annual revenue, single 100 kg/day plant" },
  { value: "₹10.24 Cr", label: "Projected EBITDA — ~75% gross margin" },
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
          <p className="slide-eyebrow">03 / Products</p>
          <h1 className="slide-title">From captured carbon to commercial product</h1>
          <p className="slide-subtitle">
            Our decomposition process doesn't just capture carbon emissions —
            it splits it into three saleable outputs, each with its own
            market and price point.
          </p>
        </header>

        <div className="stat-strip">
          {STATS.map((s) => (
            <div className="stat-tile" key={s.label}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

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

        <h2 className="section-heading">Finances</h2>
        <p className="slide-subtitle finance-lede">
          Unit economics for a single 100 kg/day plant — steady-state,
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
                <th>Annual revenue (₹ Cr)</th>
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
            Replicated across 10 plants: ~₹137.4 Cr annual revenue and
            ~₹102.4 Cr EBITDA — revenue scales linearly with CO₂ capture
            capacity, each plant a self-contained profit centre.
          </p>
        </div>
      </div>
    </div>
  );
}
