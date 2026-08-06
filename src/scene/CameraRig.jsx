import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSimStore } from "../store.js";
import { stageAt } from "../tour/stages.js";

// Where the camera sits when the tour is off.
const FREE_LOOK = { position: [19, 12, 25], target: [-1.2, 5.2, 0] };

// Where the opening move starts from — wide, low and off to the side, so
// the push-in reveals the scale of the structure.
const INTRO_FROM = { position: [35, 3.6, 36], target: [-1.2, 4.2, 0] };

const STAGE_SECONDS = 1.5;
const TRANSITION_SECONDS = 1.3;
const INTRO_SECONDS = 2.8;
const IDLE_BEFORE_ORBIT = 4; // seconds of no input before the slow orbit resumes

// Smootherstep: zero velocity *and* zero acceleration at both ends, so the
// camera never visibly starts or stops — the single biggest difference
// between a move that feels cheap and one that feels directed.
function smootherstep(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const tourActive = useSimStore((s) => s.tourActive);
  const tourIndex = useSimStore((s) => s.tourIndex);
  const recenterNonce = useSimStore((s) => s.recenterNonce);

  const tween = useRef({
    active: false,
    elapsed: 0,
    duration: TRANSITION_SECONDS,
    fromPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
  });
  const idleSince = useRef(0);
  const introDone = useRef(false);

  const play = (shot, duration) => {
    const t = tween.current;
    t.fromPos.copy(camera.position);
    t.toPos.set(...shot.position);
    t.fromTarget.copy(controls?.target ?? new THREE.Vector3());
    t.toTarget.set(...shot.target);
    t.elapsed = 0;
    t.duration = duration;
    t.active = true;
  };

  // Opening move: start wide, then push in to the first stage.
  useEffect(() => {
    if (!controls || introDone.current) return;
    introDone.current = true;
    camera.position.set(...INTRO_FROM.position);
    controls.target.set(...INTRO_FROM.target);
    controls.update();
    const opening = useSimStore.getState().tourActive
      ? stageAt(0).camera
      : FREE_LOOK;
    play(opening, INTRO_SECONDS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls]);

  // Fly to the current stage as the tour advances, and whenever a recentre
  // is explicitly requested.
  useEffect(() => {
    if (!controls || !introDone.current) return;
    if (!useSimStore.getState().tourActive) return;
    play(stageAt(tourIndex).camera, STAGE_SECONDS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourIndex, tourActive, recenterNonce]);

  // Deliberately nothing here for viewMode.
  //
  // Exterior and cutaway are two renderings of the same plant in the same
  // place. Flying the camera between them made the toggle feel like a scene
  // change rather than a shell opening, and it threw away whatever angle
  // the visitor had chosen. The cross-fade does all the work; the camera
  // holds still.

  // Any user input pauses the idle orbit, and cancels an in-flight move so
  // the camera never fights the pointer.
  useEffect(() => {
    if (!controls) return;
    const onStart = () => {
      idleSince.current = 0;
      tween.current.active = false;
    };
    controls.addEventListener("start", onStart);
    return () => controls.removeEventListener("start", onStart);
  }, [controls]);

  useFrame((_, delta) => {
    if (!controls) return;
    const t = tween.current;

    if (t.active) {
      t.elapsed += delta;
      const k = smootherstep(Math.min(1, t.elapsed / t.duration));
      camera.position.lerpVectors(t.fromPos, t.toPos, k);
      controls.target.lerpVectors(t.fromTarget, t.toTarget, k);
      controls.update();
      if (t.elapsed >= t.duration) {
        t.active = false;
        idleSince.current = 0;
      }
      return;
    }

    // Slow orbit while a stage sits untouched. It stops as soon as anyone
    // grabs the model, and never runs over the schematic where a moving
    // camera makes the readouts harder to follow.
    idleSince.current += delta;
    const state = useSimStore.getState();
    const shouldOrbit =
      state.viewMode === "exterior" && idleSince.current > IDLE_BEFORE_ORBIT;
    if (shouldOrbit) {
      // ease the orbit up to speed over its first couple of seconds
      const ramp = Math.min(1, (idleSince.current - IDLE_BEFORE_ORBIT) / 2);
      // gentler while a stage is framed — this is a slow drift around a
      // subject, not a turntable spin of the whole plant
      controls.autoRotateSpeed = (state.tourActive ? 0.16 : 0.28) * ramp;
      controls.autoRotate = true;
    } else {
      controls.autoRotate = false;
    }
    controls.update();
  });

  return null;
}
