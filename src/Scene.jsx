import { useSimStore } from "./store.js";
import { SceneCore } from "./scene/SceneCore.jsx";
import { CameraRig } from "./scene/CameraRig.jsx";
import { RevealGroup, CutawayGroup } from "./scene/RevealGroup.jsx";
import { ExteriorLayer } from "./scene/ExteriorLayer.jsx";
import { CutawayLayer } from "./scene/CutawayLayer.jsx";
import { TourDriver } from "./tour/TourDriver.jsx";
import { Section } from "./tour/Section.jsx";
import { LayerContext } from "./tour/LayerContext.js";
import { SECTION } from "./tour/stages.js";
import { Ground } from "./components/exterior/Ground.jsx";
import { Chimney } from "./components/Chimney.jsx";

// The scene is two representations of the same plant, sharing one set of
// coordinates from layout.js:
//
//   ExteriorLayer  the plant as built — opaque, clad. The default.
//   CutawayLayer   the schematic X-ray — process internals and flow.
//
// Only the layers the transition actually needs are mounted. A hidden layer
// is not free: every component in it keeps its useFrame callbacks running,
// so leaving the schematic mounted behind an opaque shell means animating
// bubbles and flow dots nobody can see.
export function Scene() {
  const phase = useSimStore((s) => s.revealPhase);
  const showExterior = phase !== "cutaway";
  const showCutaway = phase !== "exterior";

  return (
    <>
      <SceneCore />
      <CameraRig />
      <TourDriver />

      {/* shared by both views, so it never fades on the cross-over */}
      <LayerContext.Provider value="shared">
        <Ground />
        {/* the stack is shared; its plume is process motion, so it lives
            in the cutaway layer with the rest of the animation */}
        <Section id={SECTION.SOURCE}>
          <Chimney />
        </Section>
      </LayerContext.Provider>

      {showExterior && (
        <RevealGroup>
          <ExteriorLayer />
        </RevealGroup>
      )}

      {showCutaway && (
        <CutawayGroup>
          <CutawayLayer />
        </CutawayGroup>
      )}
    </>
  );
}
