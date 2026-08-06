import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSimStore } from "../store.js";

// Running machinery is never perfectly still. A motor under load sits a
// fraction off-centre and trembles at its own frequency — the same reason a
// window air-conditioner buzzes in its frame.
//
// The amplitude here is tiny on purpose: a few millimetres at plant scale.
// You should never catch the model shaking; you should only notice that a
// stopped machine looks dead next to a running one.
//
// Two frequencies are summed so the motion never lands on an obvious loop,
// and it eases in and out with load rather than snapping on.

const AMPLITUDE = 0.0075; // world units
const TILT = 0.0045; // radians
const SPIN_UP = 1.6; // seconds to reach full trembling

export function useMachineIdle(ref, isRunning) {
  const elapsed = useRef(0);
  const load = useRef(0);

  useFrame((_, delta) => {
    const object = ref.current;
    if (!object) return;

    const running = isRunning(useSimStore.getState());
    const target = running ? 1 : 0;
    const step = delta / SPIN_UP;
    load.current += Math.max(-step, Math.min(step, target - load.current));

    if (load.current <= 0.001) {
      object.position.x = object.userData.restX ?? object.position.x;
      object.position.z = object.userData.restZ ?? object.position.z;
      object.rotation.z = 0;
      return;
    }

    // remember where the machine actually sits, once
    object.userData.restX ??= object.position.x;
    object.userData.restZ ??= object.position.z;

    elapsed.current += delta;
    const t = elapsed.current;
    const shake =
      Math.sin(t * 47) * 0.6 + Math.sin(t * 31.3 + 1.1) * 0.4;
    const shakeZ =
      Math.sin(t * 43.7 + 0.5) * 0.6 + Math.sin(t * 29.1 + 2.3) * 0.4;

    object.position.x = object.userData.restX + shake * AMPLITUDE * load.current;
    object.position.z = object.userData.restZ + shakeZ * AMPLITUDE * load.current;
    object.rotation.z = shake * TILT * load.current;
  });
}
