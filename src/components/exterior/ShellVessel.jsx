import { useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import {
  paintedSteel,
  weatheredSteel,
  galvanised,
  stainless,
  safetyYellow,
} from "../../materials/industrial.js";
import { HEAD_RATIO } from "../../layout.js";
import { useLogoTexture, LOGO_ASPECT } from "../../materials/logo.js";

// Profile of a real pressure vessel, revolved around Y: an elliptical
// bottom head, the straight cylindrical shell, then an elliptical top head.
// Built as one lathe so the silhouette is continuous — the giveaway of a
// hobby model is flat cylinder caps meeting the wall at a hard 90 degrees.
function vesselProfile(radius, height, headRatio, flatBottom = false, segments = 14) {
  const depth = radius * headRatio;
  const half = height / 2;
  const points = [];

  if (flatBottom) {
    // ground-standing tank: a flat floor plate, no bottom head
    points.push(new THREE.Vector2(0, -half));
    points.push(new THREE.Vector2(radius, -half));
  } else {
    // elevated vessel: bottom head sweeping from the pole out to the shell
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * (Math.PI / 2);
      points.push(new THREE.Vector2(radius * Math.sin(a), -half - depth * Math.cos(a)));
    }
  }
  // straight shell
  points.push(new THREE.Vector2(radius, half));
  // top head
  for (let i = 1; i <= segments; i++) {
    const a = (i / segments) * (Math.PI / 2);
    points.push(new THREE.Vector2(radius * Math.cos(a), half + depth * Math.sin(a)));
  }
  return points;
}

// Bolted flange where a pipe penetrates the shell. The bolt circle is the
// detail eyes use to judge that a connection is real.
export function Nozzle({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.12,
  bolts = 8,
}) {
  const flangeR = radius * 2.4;
  const steel = galvanised("#7f878f");
  return (
    <group position={position} rotation={rotation}>
      {/* stub pipe out of the shell */}
      <mesh position={[0, radius * 1.1, 0]}>
        <cylinderGeometry args={[radius * 1.15, radius * 1.15, radius * 2.2, 20]} />
        <meshStandardMaterial {...stainless()} />
      </mesh>
      {/* flange face */}
      <mesh position={[0, radius * 2.3, 0]}>
        <cylinderGeometry args={[flangeR, flangeR, radius * 0.5, 28]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      {/* companion flange with a gasket line between them */}
      <mesh position={[0, radius * 2.75, 0]}>
        <cylinderGeometry args={[flangeR, flangeR, radius * 0.36, 28]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      {Array.from({ length: bolts }, (_, i) => {
        const a = (i / bolts) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * flangeR * 0.76, radius * 2.5, Math.sin(a) * flangeR * 0.76]}
          >
            <cylinderGeometry args={[radius * 0.16, radius * 0.16, radius * 1.3, 6]} />
            <meshStandardMaterial {...galvanised("#5f666d")} />
          </mesh>
        );
      })}
    </group>
  );
}

// Stencilled equipment tag on a plate bolted to the shell — how process
// equipment is actually identified on site, and it replaces the floating
// text the schematic uses.
function Nameplate({ radius, y, tag, title, accent = "#d8dee6" }) {
  const width = 1.5;
  const height = 0.62;
  return (
    <group position={[0, y, radius + 0.005]}>
      <mesh>
        <boxGeometry args={[width, height, 0.035]} />
        <meshStandardMaterial {...paintedSteel("#1d2228")} />
      </mesh>
      {/* four corner fixings */}
      {[
        [-width / 2 + 0.09, height / 2 - 0.09],
        [width / 2 - 0.09, height / 2 - 0.09],
        [-width / 2 + 0.09, -height / 2 + 0.09],
        [width / 2 - 0.09, -height / 2 + 0.09],
      ].map(([x, py], i) => (
        <mesh key={i} position={[x, py, 0.026]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.02, 6]} />
          <meshStandardMaterial {...galvanised("#9aa1a8")} />
        </mesh>
      ))}
      <Text
        position={[0, 0.13, 0.026]}
        fontSize={0.2}
        color={accent}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.08}
      >
        {tag}
      </Text>
      <Text
        position={[0, -0.14, 0.026]}
        fontSize={0.108}
        color="#8f9aa5"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.05}
      >
        {title}
      </Text>
    </group>
  );
}

// The house mark on the shell, above the nameplate. Deliberately small and
// unlit — a maker's mark on the equipment rather than branding stuck over
// the render.
function LogoMark({ radius, y, height = 0.5 }) {
  const texture = useLogoTexture();
  if (!texture) return null;
  return (
    <mesh position={[0, y, radius + 0.02]}>
      {/* the mark is taller than it is wide; keep its aspect so it never
          squashes on a vessel of a different size */}
      <planeGeometry args={[height * LOGO_ASPECT, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.85}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

// A clad process vessel: dished heads, welded shell courses, reinforcement
// bands, insulation-jacket banding, nozzles, and a stencilled nameplate.
export function ShellVessel({
  position = [0, 0, 0],
  radius,
  height,
  tint = "#aeb8c2",
  tag,
  title,
  bands = 2,
  nozzles = [],
  skirt = null, // { height } — support skirt down to a deck or the ground
  accent = null, // colour of the hazard band around the base of the shell
  flatBottom = false, // ground-standing tank: flat floor instead of a head
  children,
}) {
  const profile = useMemo(
    () => vesselProfile(radius, height, HEAD_RATIO, flatBottom),
    [radius, height, flatBottom]
  );

  const half = height / 2;
  const bandYs = Array.from(
    { length: bands },
    (_, i) => -half + ((i + 1) * height) / (bands + 1)
  );

  return (
    <group position={position}>
      {/* shell + heads, one continuous revolved surface */}
      <mesh>
        <latheGeometry args={[profile, 44]} />
        <meshStandardMaterial {...weatheredSteel(tint)} side={THREE.DoubleSide} />
      </mesh>

      {/* circumferential weld seams between shell courses */}
      {bandYs.map((y) => (
        <mesh key={`seam-${y}`} position={[0, y, 0]}>
          <cylinderGeometry args={[radius + 0.018, radius + 0.018, 0.075, 44]} />
          <meshStandardMaterial {...paintedSteel(tint)} />
        </mesh>
      ))}

      {/* head-to-shell knuckle rings, top and bottom */}
      {(flatBottom ? [half] : [-half, half]).map((y) => (
        <mesh key={`knuckle-${y}`} position={[0, y, 0]}>
          <cylinderGeometry args={[radius + 0.03, radius + 0.03, 0.11, 44]} />
          <meshStandardMaterial {...galvanised("#7d858d")} />
        </mesh>
      ))}

      {/* hazard band low on the shell, if this vessel carries one */}
      {accent && (
        <mesh position={[0, -half + 0.42, 0]}>
          <cylinderGeometry args={[radius + 0.012, radius + 0.012, 0.3, 44]} />
          <meshStandardMaterial {...safetyYellow()} color={accent} />
        </mesh>
      )}

      {/* support skirt: a plain cylinder from the bottom head down to
          whatever the vessel stands on, with a bolted base ring */}
      {skirt && (
        <group>
          <mesh position={[0, -half - skirt.height / 2, 0]}>
            <cylinderGeometry
              args={[radius * 0.86, radius * 0.86, skirt.height, 40, 1, true]}
            />
            <meshStandardMaterial
              {...weatheredSteel(tint)}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* access opening in the skirt, as every real one has */}
          <mesh position={[0, -half - skirt.height * 0.55, radius * 0.86]}>
            <boxGeometry args={[radius * 0.5, skirt.height * 0.5, 0.05]} />
            <meshStandardMaterial {...paintedSteel("#15181c")} />
          </mesh>
          <mesh position={[0, -half - skirt.height + 0.06, 0]}>
            <cylinderGeometry args={[radius * 1.04, radius * 1.04, 0.12, 40]} />
            <meshStandardMaterial {...galvanised("#6e767e")} />
          </mesh>
        </group>
      )}

      {nozzles.map((n, i) => (
        <Nozzle key={i} {...n} />
      ))}

      {children}

      {/* house mark, sitting just above the equipment tag */}
      {tag && <LogoMark radius={radius} y={half - height * 0.3 + 0.62} />}

      {tag && (
        <Nameplate
          radius={radius}
          y={half - height * 0.3}
          tag={tag}
          title={title}
        />
      )}
    </group>
  );
}
