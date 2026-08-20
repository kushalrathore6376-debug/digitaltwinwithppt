const LEADERSHIP = [
  {
    name: "Deependra Singh Shekhawat",
    role: "CEO",
    bio: "Extensive experience in corporate finance and global trade operations.",
    photo: "/team/deependra-singh-shekhawat.jpeg",
  },
  {
    name: "Reetam Chaudhury",
    role: "CTO",
    bio: "Materials science and sustainability expert leading technical innovation.",
    photo: "/team/reetam-chaudhury.jpeg",
  },
  {
    name: "Dr. Pramod Sharma",
    role: "Chief Innovation Officer",
    bio: "Researcher & chemical expert.",
    photo: "/team/pramod-sharma.png",
  },
  {
    name: "Dr. Mainak Palit",
    role: "Chief Product Officer",
    bio: "10+ years in experimental condensed matter physics — electron microscopy, cryogenics, ultra-high vacuum systems and low-dimensional materials.",
    photo: "/team/mainak-palit.jpeg",
  },
];

const MANAGEMENT = [
  {
    name: "Kirti Raj Singh Shekhawat",
    role: "Company Finances & Growth",
    photo: "/team/kirti-raj-singh-shekhawat.jpeg",
  },
  {
    name: "Hardik Abusariya",
    role: "CCU Automation & Data Management",
    photo: "/team/hardik-abusariya.jpeg",
  },
  {
    name: "Saurabh Tripathi",
    role: "Logistics",
    photo: "/team/saurabh-tripathi.png",
  },
  {
    name: "Kushal Singh Rathore",
    role: "CCU Development",
    photo: "/team/kushal-singh-rathore.jpeg",
  },
  {
    name: "Virendra Singh",
    role: "Financial Operations",
    photo: "/team/virendra-singh.jpeg",
  },
];

const ADVISORY = [
  {
    name: "Dr. LP Singh",
    role: "Director General, National Council for Cement & Building Materials — Government of India, IITR",
    photo: "/team/lp-singh.jpeg",
  },
  {
    name: "Mr. Samrat Sengupta",
    role: "Director Technical, ProClime",
    photo: "/team/samrat-sengupta.jpeg",
  },
  {
    name: "Lt. Col. Monish Ahuja (Retd.)",
    role: "Managing Director, PRESPL",
    photo: "/team/monish-ahuja.jpeg",
  },
];

function TeamCard({ person }) {
  return (
    <div className="team-card">
      <img className="team-photo" src={person.photo} alt={person.name} />
      <h4>{person.name}</h4>
      <p className="team-role">{person.role}</p>
      {person.bio ? <p className="team-bio">{person.bio}</p> : null}
    </div>
  );
}

export function TeamSlide() {
  return (
    <div className="slide team-slide">
      <div className="slide-ambient" aria-hidden="true">
        <div className="slide-blob slide-blob-green" />
        <div className="slide-blob slide-blob-orange" />
      </div>
      <div className="slide-scroll">
        <header className="slide-header">
          <p className="slide-eyebrow">07 / Team</p>
          <h1 className="slide-title">The people behind TraceXero</h1>
          <p className="slide-subtitle">
            Combined experience of 50+ years across finance, materials
            science, industrial engineering and climate policy.
          </p>
        </header>

        <h2 className="section-heading">Leadership team</h2>
        <div className="team-grid team-grid-leadership">
          {LEADERSHIP.map((p) => (
            <TeamCard person={p} key={p.name} />
          ))}
        </div>

        <h2 className="section-heading">Management &amp; operations</h2>
        <div className="team-grid team-grid-management">
          {MANAGEMENT.map((p) => (
            <TeamCard person={p} key={p.name} />
          ))}
        </div>

        <h2 className="section-heading">Advisory team</h2>
        <div className="team-grid team-grid-advisory">
          {ADVISORY.map((p) => (
            <TeamCard person={p} key={p.name} />
          ))}
        </div>
      </div>
    </div>
  );
}
