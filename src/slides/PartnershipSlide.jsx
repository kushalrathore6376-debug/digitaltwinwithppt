const FACTS = [
  {
    label: "Effective date",
    value: "10 Mar 2026",
    detail: "Executed and notarised, Government of Uttar Pradesh e-Stamp",
  },
  {
    label: "Scope",
    value: "Development → Commercialisation",
    detail: "Technology development, validation & commercialisation for carbon capture and utilisation",
  },
  {
    label: "Status",
    value: "Notarised",
    detail: "Certificate No. IN-UP44658556025672Y, verifiable at shcilestamp.com",
  },
];

const PARTNERS = [
  {
    logo: "/partners/nccbmlogo.png",
    name: "NCCBM",
    full: "National Council for Cement & Building Materials",
    sub: "Govt. of India · DPIIT, Ministry of Commerce & Industry",
  },
  {
    logo: "/partners/rkslogo.png",
    name: "RKS",
    full: "RockSensor",
    sub: "Sensing Beyond the Vision",
  },
];

const DOCS = [
  {
    image: "/report/pdf-page-1.png",
    alt: "Government of Uttar Pradesh e-Stamp certificate for the NCB–TraceXero MOU",
    label: "01",
    title: "e-Stamp certificate",
    caption: "India Non Judicial · Government of Uttar Pradesh",
  },
  {
    image: "/report/pdf-page-2.png",
    alt: "First page of the NCB–TraceXero memorandum of understanding",
    label: "02",
    title: "MOU — page 1 of 7",
    caption: "Technology Development, Validation & Commercialisation Partnership",
  },
];

// Proof-of-partnership slide — the deck's credibility anchor between
// Products and Team. Shows the opening two pages of the notarised NCB MOU
// as premium "document" cards rather than a flat embed, so the legal
// paper reads as evidence, not filler.
export function PartnershipSlide() {
  return (
    <div className="slide partnership-slide">
      <div className="slide-ambient" aria-hidden="true">
        <div className="slide-blob slide-blob-orange" />
        <div className="slide-blob slide-blob-green" />
      </div>
      <div className="slide-scroll">
        <header className="slide-header">
          <p className="slide-eyebrow">05 / Strategic Partnership</p>
          <h1 className="slide-title">
            Validated by India&rsquo;s apex cement research body
          </h1>
          <p className="slide-subtitle">
            TraceXero&rsquo;s carbon capture technology is being developed,
            validated and commercialised under a formal MOU with NCB — the
            Government of India&rsquo;s premier R&amp;D institute for
            cement and building materials, under DPIIT, Ministry of
            Commerce &amp; Industry.
          </p>
        </header>

        <div className="partnership-facts">
          {FACTS.map((f) => (
            <div className="stat-tile fact-tile" key={f.label}>
              <span className="stat-label fact-eyebrow">{f.label}</span>
              <span className="stat-value fact-value">{f.value}</span>
              <span className="stat-label fact-detail">{f.detail}</span>
            </div>
          ))}
        </div>

        <h2 className="section-heading">The MOU</h2>
        <div className="doc-grid">
          {DOCS.map((d) => (
            <figure className="doc-card" key={d.label}>
              <span className="doc-badge">
                <span className="doc-badge-check" aria-hidden="true">
                  ✓
                </span>
                Verified
              </span>
              <div className="doc-frame">
                <span className="doc-frame-index" aria-hidden="true">
                  {d.label}
                </span>
                <img src={d.image} alt={d.alt} loading="lazy" />
              </div>
              <figcaption className="doc-caption">
                <span className="doc-caption-title">{d.title}</span>
                <span className="doc-caption-sub">{d.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <h2 className="section-heading">Partners</h2>
        <div className="partner-grid">
          {PARTNERS.map((p) => (
            <div className="partner-logo-card" key={p.name}>
              <div className="partner-logo-frame">
                <img src={p.logo} alt={`${p.name} logo`} />
              </div>
              <div className="partner-info">
                <span className="partner-name">{p.name}</span>
                <span className="partner-full">{p.full}</span>
                <span className="partner-sub">{p.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
