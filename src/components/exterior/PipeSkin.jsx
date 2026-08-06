import { useMemo } from "react";
import * as THREE from "three";
import { processPipe, stainless } from "../../materials/industrial.js";

const UP = new THREE.Vector3(0, 1, 0);

// Per-segment geometry for a polyline route: midpoint, orientation and
// length, all derived from the endpoints so a line stays correct if the
// layout moves.
function useRoute(points) {
  return useMemo(() => {
    const vectors = points.map((p) => new THREE.Vector3(...p));
    const segments = vectors.slice(0, -1).map((a, i) => {
      const b = vectors[i + 1];
      const dir = new THREE.Vector3().subVectors(b, a);
      return {
        mid: new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5),
        quaternion: new THREE.Quaternion().setFromUnitVectors(
          UP,
          dir.clone().normalize()
        ),
        length: dir.length(),
      };
    });
    return { vectors, segments };
  }, [points]);
}

// A steel process line following the same waypoints the schematic uses:
// welded lengths with raised collars at the joints, and formed elbows.
//
// Nothing here animates. The exterior view is the showcase — the process
// motion belongs to the cutaway, where you can see what is actually moving
// and why. Keeping this layer still also means it costs nothing per frame.
export function PipeSkin({ points, radius = 0.12, tint = "#ccd6e0", bandSpacing = 2.2 }) {
  const route = useRoute(points);
  const jacketRadius = radius * 1.35;
  const jacket = processPipe(tint);
  // brighter collars at the welded joints between pipe lengths
  const band = stainless("#cdd7e2");

  return (
    <group>
      {route.segments.map((segment, i) => {
        const bands = Math.max(1, Math.floor(segment.length / bandSpacing));
        return (
          <group key={i} position={segment.mid} quaternion={segment.quaternion}>
            <mesh>
              <cylinderGeometry args={[jacketRadius, jacketRadius, segment.length, 16]} />
              <meshStandardMaterial {...jacket} />
            </mesh>
            {/* raised collars where two pipe lengths are welded up */}
            {Array.from({ length: bands }, (_, b) => {
              const y = -segment.length / 2 + ((b + 0.5) * segment.length) / bands;
              return (
                <mesh key={b} position={[0, y, 0]}>
                  <cylinderGeometry
                    args={[jacketRadius + 0.012, jacketRadius + 0.012, 0.05, 16]}
                  />
                  <meshStandardMaterial {...band} />
                </mesh>
              );
            })}
          </group>
        );
      })}

      {/* formed elbows at the interior corners */}
      {route.vectors.slice(1, -1).map((p, i) => (
        <mesh key={`elbow-${i}`} position={p}>
          <sphereGeometry args={[jacketRadius * 1.06, 14, 12]} />
          <meshStandardMaterial {...jacket} />
        </mesh>
      ))}
    </group>
  );
}
