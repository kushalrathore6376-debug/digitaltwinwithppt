import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSimStore } from "../store.js";
import { stageAt } from "../tour/stages.js";
import { explainStepAt } from "../tour/explain.js";

// Where the camera sits when the tour is off.
const FREE_LOOK = { position: [29, 18, 36], target: [3.6, 7, 2] };

// Where the opening move starts from — wide, low and off to the side, so
// the push-in reveals the scale of the structure.
const INTRO_FROM = { position: [52, 6, 52], target: [3.6, 6, 2] };

const STAGE_SECONDS = 1.5;
const TRANSITION_SECONDS = 1.3;
const INTRO_SECONDS = 2.8;
const EXPLAIN_SECONDS = 2.2;

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
  const explainActive = useSimStore((s) => s.explainActive);
  const explainIndex = useSimStore((s) => s.explainIndex);

  const tween = useRef({
    active: false,
    elapsed: 0,
    duration: TRANSITION_SECONDS,
    fromPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
  });
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
    const state = useSimStore.getState();
    if (state.explainActive || !state.tourActive) return;
    play(stageAt(tourIndex).camera, STAGE_SECONDS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourIndex, tourActive, recenterNonce]);

  // The guided explanation's own shots. Slower than the rail's: this one is
  // being talked over, and a move that lands before the sentence does leaves
  // the camera sitting still through most of it.
  useEffect(() => {
    if (!controls || !introDone.current || !explainActive) return;
    play(explainStepAt(explainIndex).camera, EXPLAIN_SECONDS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explainActive, explainIndex]);

  // Deliberately nothing here for viewMode.
  //
  // Exterior and cutaway are two renderings of the same plant in the same
  // place. Flying the camera between them made the toggle feel like a scene
  // change rather than a shell opening, and it threw away whatever angle
  // the visitor had chosen. The cross-fade does all the work; the camera
  // holds still.

  // Any user input cancels an in-flight move, so the camera never fights the
  // pointer.
  useEffect(() => {
    if (!controls) return;
    const onStart = () => {
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
      if (t.elapsed >= t.duration) t.active = false;
      return;
    }

    // Nothing moves the camera on its own once a move has landed.
    //
    // There used to be a slow orbit here after a few seconds of no input. It
    // demos well and presents badly: the model is talked over, and a view
    // that drifts while someone is pointing at a part of it takes the thing
    // they are pointing at away from them. The camera now goes exactly where
    // it is sent and then holds, so a framing survives being explained.
    controls.update();
  });

  return null;
}
