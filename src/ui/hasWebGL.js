// Some browsers/environments (hardware acceleration disabled, a blocklisted
// GPU, certain locked-down or virtualised sessions) cannot create a WebGL
// context at all. React Three Fiber's own failure in that case doesn't
// reliably surface as a catchable React error — it can fail inside a
// requestAnimationFrame callback, outside any error boundary's reach — so
// this checks up front, before <Canvas> is ever mounted, and lets the
// caller render a real fallback instead of a permanently blank rectangle.
export function hasWebGL() {
  if (typeof document === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext("experimental-webgl", { failIfMajorPerformanceCaveat: false });
    return !!gl;
  } catch {
    return false;
  }
}
