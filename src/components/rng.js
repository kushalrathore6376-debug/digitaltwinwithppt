// Small deterministic pseudo-random generator.
//
// Particle seeds used to come from Math.random() inside useMemo, which is a
// side effect during render: React is free to render twice, and the second
// pass would silently produce a different scene. It also meant the plume and
// the bubbles looked different on every reload, so nothing was reproducible
// when comparing screenshots.
//
// A seeded generator fixes both. Same seed, same scene, every time.
export function makeRandom(seed = 1) {
  // mulberry32 — tiny, fast, good enough distribution for scatter
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
