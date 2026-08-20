import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  CHIMNEY_X,
  CHIMNEY_RADIUS,
  CHIMNEY_WALL,
  CHIMNEY_CUT_Y,
  CHIMNEY_GHOST_BASE_Y,
  CHIMNEY_GHOST_TOP_Y,
  GAS_TAP_Y,
} from "../layout.js";
import {
  concrete,
  galvanised,
  stainless,
  checkerPlate,
} from "../materials/industrial.js";
import { makeRandom } from "./rng.js";

const BASE_H = 1.1; // pedestal height
const SEGMENTS = 96;
const R = CHIMNEY_RADIUS;
const BORE = CHIMNEY_RADIUS - CHIMNEY_WALL;

// Concrete, one recipe, three tones: the weathered outside face, the sooted
// flue, and the cut rim between them.
const SHELL = concrete("#7c7e7c");
const RIM = concrete("#8b8d86");
const SOOT = { color: "#453e37", roughness: 1, metalness: 0 };

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// A vertical alpha ramp, as a one-pixel-wide texture. The middle section has
// to fade *along its own length*, which an opacity value cannot do — stacking
// short segments at stepped opacities was the alternative and it banded
// visibly. A ramp in the alpha channel is one mesh, one draw, one dissolve.
//
// Canvas row 0 is the top of the image, and an unflipped texture puts that at
// v = 1, which is the top of the cylinder wall.
function fadeTexture(alphaAt) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  for (let row = 0; row < canvas.height; row++) {
    const v = 1 - row / (canvas.height - 1);
    const level = Math.round(255 * Math.min(1, Math.max(0, alphaAt(v))));
    ctx.fillStyle = `rgb(${level},${level},${level})`;
    ctx.fillRect(0, row, 1, 1);
  }
  return new THREE.CanvasTexture(canvas);
}

// An open-ended shell with the flue bore inside it and a rim closing the
// wall thickness at one or both ends. Both solid pieces of the stack are
// this, which is what makes them read as one chimney with a length missing
// rather than as two different objects.
function Shaft({ from, to, rimTop = false, rimBottom = false, floor = false }) {
  const height = to - from;
  return (
    <group position={[0, (from + to) / 2, 0]}>
      <mesh>
        <cylinderGeometry args={[R, R, height, SEGMENTS, 1, true]} />
        <meshStandardMaterial {...SHELL} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[BORE, BORE, height, SEGMENTS, 1, true]} />
        <meshStandardMaterial {...SOOT} side={THREE.DoubleSide} />
      </mesh>
      {rimTop && (
        <mesh position={[0, height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[BORE, R, SEGMENTS]} />
          <meshStandardMaterial {...RIM} side={THREE.DoubleSide} />
        </mesh>
      )}
      {rimBottom && (
        <mesh position={[0, -height / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[BORE, R, SEGMENTS]} />
          <meshStandardMaterial {...RIM} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* A floor, far enough down the flue that looking in gives you depth
          rather than a surface. This is what stops you seeing through the top
          section into the gap below, and it does it the way the base section
          already does: the shaft simply has a bottom. Anything placed *in* the
          mouth to block the view — a plate, a dome, a dish — has an edge where
          it meets the wall, and that edge is what kept reading as an object
          sitting in the pipe. A floor five metres down has no edge at all,
          only the corner any shaft has. */}
      {floor && (
        <mesh position={[0, -height / 2 + 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[BORE, SEGMENTS]} />
          <meshStandardMaterial color="#221d19" roughness={1} metalness={0} />
        </mesh>
      )}
    </group>
  );
}

// The length of stack that is not drawn.
//
// Both ends of it are solid chimney, and this is the piece between them: the
// same cylinder at the same radius, dissolving away from each end until there
// is almost nothing left in the middle, with guide dashes across the emptiest
// part. It is the break symbol a drawing uses when it folds a long member out
// of the sheet, and it is deliberately short — the missing length is four
// fifths of the real stack, and drawing it would put a hundred metres of empty
// concrete back in frame.
//
// A hair outside the shells it joins, and writing no depth: it overlaps each
// of them slightly so there is no seam, and at exactly the same radius the two
// surfaces would z-fight all the way round the overlap.
const MISSING_FROM = CHIMNEY_CUT_Y - 0.05;
const MISSING_TO = CHIMNEY_GHOST_BASE_Y + 0.05;
const MISSING_SPAN = MISSING_TO - MISSING_FROM;

function MissingLength() {
  const { hazeMat, dashMat, dashGeo } = useMemo(() => {
    // strong where it leaves the concrete at either end, almost nothing in
    // between
    const fade = fadeTexture((v) =>
      Math.max(
        0.5 * (1 - smoothstep(0.0, 0.3, v)),
        0.5 * smoothstep(0.7, 1.0, v),
        0.035
      )
    );
    return {
      hazeMat: new THREE.MeshStandardMaterial({
        ...SHELL,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        alphaMap: fade,
      }),
      dashMat: new THREE.MeshBasicMaterial({
        color: "#93a0ad",
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        toneMapped: false,
      }),
      dashGeo: new THREE.CylinderGeometry(0.035, 0.035, 0.4, 6),
    };
  }, []);

  // four columns of dashes round the shaft, so the gap reads from any angle
  const dashes = useMemo(() => {
    const out = [];
    const r = R + 0.08;
    for (let y = MISSING_FROM + 1.0; y < MISSING_TO - 0.6; y += 0.74) {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        out.push([Math.sin(a) * r, y, Math.cos(a) * r]);
      }
    }
    return out;
  }, []);

  return (
    <group>
      <mesh position={[0, (MISSING_FROM + MISSING_TO) / 2, 0]} material={hazeMat}>
        <cylinderGeometry
          args={[R + 0.03, R + 0.03, MISSING_SPAN, SEGMENTS, 1, true]}
        />
      </mesh>
      {dashes.map((p, i) => (
        <mesh key={i} position={p} geometry={dashGeo} material={dashMat} />
      ))}
    </group>
  );
}

// The plume, out of the top of the stack.
//
// It leaves from the top section's bore and nowhere else — a stack that smokes
// out of its cut face would say the cut is the top, which is the one thing the
// drawing is trying not to say. It is also the last piece of the argument the
// model makes: this is the flue the unit taps, and it is still emitting.
//
// Slow on purpose. Fast smoke reads as a fire; a stack this wide moves its
// plume lazily, and at demo scale anything quicker turns into a flicker in the
// corner of the frame while someone is talking over it.
//
// Two populations, because the plume has two jobs. The mouth band churns in
// the top of the bore and never leaves it: that is what keeps the opening
// packed from every angle, and what hides the edge of the dome below it. The
// column is the plume proper, and it leans — hard. A real stack's smoke is
// pushed over by the wind within a stack-width of the mouth and trails off
// sideways, thinning as it goes; a symmetrical fountain standing straight up
// is the one thing smoke never does.
const MOUTH_PUFFS = 22;
const COLUMN_PUFFS = 68;
const PUFFS = MOUTH_PUFFS + COLUMN_PUFFS;
const MOUTH_RISE = 1.8; // how far the mouth band churns before recycling
const PLUME_RISE = 8.5; // how far a column puff travels before recycling
const PLUME_DRIFT = 1.15; // sideways lean per unit of climb, as wind gives
const PLUME_MOUTH = 0.72; // how much of the bore the puffs are born across

// Peak opacity of one card. Deliberately low: density comes from stacking six
// or eight of them, and that is the whole difference between smoke and a bag
// of balls. At 0.5 a card is legible on its own — you can see where one ends
// and the next begins, so the plume reads as the handful of objects it is. At
// 0.16 no single card can be picked out and only the accumulation shows.
const PUFF_ALPHA = 0.16;
const MOUTH_ALPHA = 0.22;

// One soft round puff, as a texture.
//
// This is the difference between smoke and a heap of grey balls. Geometry with
// a hard silhouette reads as a sphere however faint it is, and the previous
// plume was exactly that: sixteen circles you could count. A radial falloff on
// a flat card has no edge to catch, so where two overlap they merge instead of
// stacking, which is the only way a handful of cards ever reads as one mass.
//
// The falloff is squared and a little noise is mixed in, so it is not a clean
// airbrush dot — real smoke is blotchy, and a perfect gradient reads as a
// lens flare.
function puffTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(size, size);
  const random = makeRandom(7);
  // Light noise only. Every card shares this one texture, so strong blotches
  // repeat across the whole plume and read as a pattern rather than as smoke;
  // the per-card roll below is what keeps even this much from lining up.
  const noise = Array.from({ length: size * size }, () => 0.86 + random() * 0.14);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const dx = (x + 0.5) / size - 0.5;
      const dy = (y + 0.5) / size - 0.5;
      const d = Math.min(1, Math.hypot(dx, dy) * 2);
      const falloff = (1 - d) * (1 - d);
      image.data[i * 4] = 255;
      image.data[i * 4 + 1] = 255;
      image.data[i * 4 + 2] = 255;
      image.data[i * 4 + 3] = Math.round(255 * falloff * noise[i]);
    }
  }
  ctx.putImageData(image, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

// The walkway round the top of the stack: a deck ring on brackets, a kick
// plate, and a handrail on posts. Drawn as rings rather than as a hundred
// separate members — at this distance the posts are the only thing that has to
// be countable, and they are what makes it read as something people stand on.
function StackGallery({ y }) {
  const deck = R + 0.75;
  const posts = 28;
  return (
    <group position={[0, y, 0]}>
      {/* deck and its outer kick plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[R, deck, 64]} />
        <meshStandardMaterial {...checkerPlate("#5f676e")} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[deck, deck, 0.22, 64, 1, true]} />
        <meshStandardMaterial {...galvanised("#6d757c")} side={THREE.DoubleSide} />
      </mesh>

      {/* brackets carrying it off the shaft */}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * (R + 0.36), -0.34, Math.cos(a) * (R + 0.36)]}
            rotation={[0.5, -a, 0]}
          >
            <boxGeometry args={[0.08, 0.78, 0.1]} />
            <meshStandardMaterial {...galvanised("#6b737a")} />
          </mesh>
        );
      })}

      {/* handrail: posts, top rail, mid rail */}
      {Array.from({ length: posts }, (_, i) => {
        const a = (i / posts) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * (deck - 0.08), 0.55, Math.cos(a) * (deck - 0.08)]}
          >
            <cylinderGeometry args={[0.035, 0.035, 1.1, 6]} />
            <meshStandardMaterial {...galvanised("#7b838b")} />
          </mesh>
        );
      })}
      {[1.08, 0.6].map((h) => (
        <mesh key={h} position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[deck - 0.08, 0.035, 6, 64]} />
          <meshStandardMaterial {...galvanised("#7b838b")} />
        </mesh>
      ))}
    </group>
  );
}

// One flat value for smoke, shared by every puff. Kept as a constant because
// the plume is many overlapping cards of the same colour and they must agree
// exactly — a difference of a shade between them and the overlaps show up as
// banding rather than as thickness.
const SMOKE_COLOR = "#c2cacd";

function Plume() {
  const groupRef = useRef();
  const clock = useRef(0);

  // Seeded, like the rest of the stack: a plume that reshuffles itself on
  // every reload is a distraction rather than a detail.
  const puffs = useMemo(() => {
    const random = makeRandom(41);
    return Array.from({ length: PUFFS }, (_, i) => {
      const mouth = i < MOUTH_PUFFS;
      const span = mouth ? MOUTH_RISE : PLUME_RISE;
      const index = mouth ? i : i - MOUTH_PUFFS;
      const count = mouth ? MOUTH_PUFFS : COLUMN_PUFFS;
      // Spaced evenly along the run, with only a little jitter. Random start
      // positions clumped and left gaps, and a gap in a plume is a hole you
      // see the sky through — the trail has to be continuous before anything
      // else about it matters.
      const rise = ((index + random() * 0.4) / count) * span;
      // born across the mouth, so the opening is covered rather than trailed
      // over by a line of puffs up the middle
      const angle = random() * Math.PI * 2;
      const spread = Math.sqrt(random()) * BORE * PLUME_MOUTH;
      return {
        mouth,
        span,
        rise,
        speed: (mouth ? 0.34 : 0.8) * (0.9 + random() * 0.2),
        size: mouth ? 3.6 + random() * 1.6 : 2.9 + random() * 1.7,
        growth: mouth ? 0.15 : 0.5 + random() * 0.45,
        peak: (mouth ? MOUTH_ALPHA : PUFF_ALPHA) * (0.8 + random() * 0.4),
        origin: [Math.cos(angle) * spread, Math.sin(angle) * spread],
        // Small per-puff wander around the shared streamline, and nothing
        // more. This used to be a puff's entire lateral motion, at nearly
        // three metres of swing each, which is exactly what pulled the mass
        // apart into separate balls drifting on their own paths.
        jitter: 0.35 + random() * 0.5,
        phase: random() * Math.PI * 2,
        wobble: 0.5 + random() * 0.6,
        spin: (random() - 0.5) * 0.4,
        tilt: random() * Math.PI * 2,
      };
    });
  }, []);

  const material = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      color: SMOKE_COLOR,
      map: puffTexture(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    });
    // Section tints and fades every material it finds; this one animates its
    // own opacity per puff, so it says so and is left alone.
    m.userData.selfAnimatedOpacity = true;
    return m;
  }, []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    clock.current += delta;
    const time = clock.current;

    group.children.forEach((puff, i) => {
      const seed = puffs[i];
      seed.rise += seed.speed * delta;
      if (seed.rise > seed.span) seed.rise -= seed.span;
      const t = seed.rise / seed.span;

      // Every puff at a given height sits on the same streamline.
      //
      // This is what makes it one body of smoke rather than a cloud of
      // independent balls: the plume's path is a function of height alone, and
      // a puff only wanders a little around it. Before, each puff swung on its
      // own sine, so two neighbours at the same height could be three metres
      // apart and the mass had no shape to hold.
      //
      // The wave travels *up* the plume rather than standing still — the phase
      // runs against height, so a bend forms at the mouth and is carried
      // upward, which is how smoke actually moves. The lean is quadratic in
      // height, so it leaves the mouth going nearly straight up and is only
      // turned over once clear of the stack: a plume's bent neck. Climb is
      // eased off for the same reason — it stops rising as the wind takes it,
      // so the trail flattens downwind instead of running diagonally out of
      // frame.
      const lean = seed.mouth ? 0 : t * t * PLUME_DRIFT * seed.span;
      const climb = seed.mouth ? seed.rise : seed.span * Math.sqrt(t) * 0.62;
      const sway = seed.mouth ? 0.35 : 0.35 + t * 2.3;
      const streamX = Math.sin(time * 0.42 - seed.rise * 0.33) * sway;
      const streamZ = Math.cos(time * 0.35 - seed.rise * 0.28) * sway * 0.7;
      const wanderX = Math.sin(time * seed.wobble + seed.phase) * seed.jitter;
      const wanderZ =
        Math.cos(time * seed.wobble * 0.8 + seed.phase) * seed.jitter;
      puff.position.set(
        seed.origin[0] + lean + streamX + wanderX,
        CHIMNEY_GHOST_TOP_Y - 1.2 + climb,
        seed.origin[1] + lean * 0.42 + streamZ + wanderZ
      );

      // Billboard, then roll in its own plane: a card turned to the camera has
      // no orientation of its own, so the roll is the only thing that says the
      // puff is turning over rather than sliding.
      puff.quaternion.copy(state.camera.quaternion);
      puff.rotateZ(seed.tilt + time * seed.spin);

      // Billowing, not scaling: it swells fast leaving the mouth and keeps
      // widening as it thins, and the two axes swell out of step so the
      // silhouette never settles into a circle.
      const grow = seed.size * (0.85 + t * seed.growth * 2.1);
      puff.scale.set(
        grow * (1 + Math.sin(time * 0.9 + seed.phase) * 0.08),
        grow * (1 + Math.cos(time * 0.7 + seed.phase) * 0.08),
        1
      );

      // In fast, out slowly, and at full weight for most of the run. A card
      // that starts thinning early leaves a lean patch in the middle of the
      // trail, and lean patches are what break a continuous plume back into
      // separate puffs.
      puff.material.opacity =
        seed.peak * smoothstep(0, 0.08, t) * (1 - smoothstep(0.55, 1, t));
    });
  });

  return (
    <group ref={groupRef}>
      {puffs.map((_, i) => (
        <mesh key={i} material={material.clone()} renderOrder={30}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
}

// Industrial flue stack, drawn with its middle taken out.
//
// It is wider than the container is deep and taller than it is high, on
// purpose. A stack passing this much gas really is that big, and the size of
// it against the box beside it is the comparison the whole model rests on.
// Cutting a length out of the middle is what keeps that readable without a
// hundred metres of empty concrete leaving the frame.
//
// Both remaining pieces are solid and identical in section — same radius, same
// wall, same rim — so it reads as one chimney: base, missing length, top. It
// was drawn as a single torn-off stump before, and the broken edge did the
// opposite of its job, ending the stack in a bright jagged line exactly where
// the eye needed to carry on upward.
export function Chimney() {
  return (
    <group position={[CHIMNEY_X, 0, 0]}>
      {/* pedestal */}
      <mesh position={[0, BASE_H / 2, 0]}>
        <cylinderGeometry args={[R + 0.22, R + 0.7, BASE_H, 72]} />
        <meshStandardMaterial {...concrete("#6a6c6b")} />
      </mesh>

      {/* the base: everything up to the cut */}
      <Shaft from={BASE_H} to={CHIMNEY_CUT_Y} rimTop />

      {/* hearth closing the bottom of the bore, so looking in gives you a
          stack rather than a hole through the ground */}
      <mesh position={[0, BASE_H + 0.06, 0]}>
        <cylinderGeometry args={[BORE, BORE, 0.12, 72]} />
        <meshStandardMaterial color="#2a2520" roughness={1} />
      </mesh>

      {/* the length that is not drawn */}
      <MissingLength />

      {/* and the top, picked up again above it */}
      <Shaft
        from={CHIMNEY_GHOST_BASE_Y}
        to={CHIMNEY_GHOST_TOP_Y}
        rimTop
        rimBottom
        floor
      />

      {/* One painted band, well down from the rim. The mouth itself is left
          plain: a stack ends at its wall thickness and nothing else — the
          flared cast lip that used to be here read as a plant pot, and it was
          the detail making the top look like a different object from the
          shaft below it. */}
      <mesh position={[0, CHIMNEY_GHOST_TOP_Y - 2.1, 0]}>
        <cylinderGeometry args={[R + 0.05, R + 0.05, 0.5, SEGMENTS, 1, true]} />
        <meshStandardMaterial {...concrete("#a8564a")} side={THREE.DoubleSide} />
      </mesh>

      {/* Service gallery, the way every real stack carries one: a walkway
          ringing the shaft below the mouth, on brackets, with a handrail. It
          is the one piece of detail up here that gives the top a size — a bare
          tube has nothing on it a person could stand on, so it reads as
          whatever diameter you assume. */}
      <StackGallery y={CHIMNEY_GHOST_TOP_Y - 3.5} />

      {/* what the stack is still putting out, off the top and nowhere else */}
      <Plume />

      {/* lift bands, where a slipformed stack is poured */}
      {[0.2, 0.4, 0.6].map((f) => (
        <mesh key={f} position={[0, BASE_H + (CHIMNEY_CUT_Y - BASE_H) * f, 0]}>
          <cylinderGeometry args={[R + 0.07, R + 0.07, 0.28, 72]} />
          <meshStandardMaterial {...concrete("#6c6e6d")} />
        </mesh>
      ))}

      {/* climbing ladder up the back of the stack, stopping short of the cut
          rather than running into thin air */}
      {Array.from(
        { length: Math.floor((CHIMNEY_CUT_Y - 0.8 - BASE_H) / 0.34) },
        (_, i) => {
          const y = BASE_H + 0.3 + i * 0.34;
          return (
            <mesh key={i} position={[0, y, -(R + 0.17)]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.024, 0.024, 0.46, 6]} />
              <meshStandardMaterial {...galvanised("#7b838b")} />
            </mesh>
          );
        }
      )}

      {/* the tapping branch: a flanged spool out of the shaft wall, where
          gasSupplyRoute() leaves for the water column. Rotated a quarter
          turn about Z so its axis lies along -X, pointing at the plant. */}
      <group position={[-(R + 0.22), GAS_TAP_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.2, 0.2, 0.48, 20]} />
          <meshStandardMaterial {...stainless()} />
        </mesh>
        {/* flange on the outboard end, and the reinforcing pad on the wall */}
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.1, 24]} />
          <meshStandardMaterial {...galvanised("#7f878f")} />
        </mesh>
        <mesh position={[0, -0.24, 0]}>
          <cylinderGeometry args={[0.36, 0.36, 0.09, 24]} />
          <meshStandardMaterial {...galvanised("#6e767e")} />
        </mesh>
      </group>
    </group>
  );
}
