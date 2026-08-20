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
import { Enclosure } from "./components/Enclosure.jsx";
import { DacFans } from "./components/DacFans.jsx";
import { ExplainArrow } from "./scene/ExplainArrow.jsx";

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
  // The exterior layer stays mounted behind the sealed container: it is what
  // the box opens onto, and building it at the moment the reveal starts
  // would hitch the one animation that has to look effortless.
  const showExterior = phase !== "cutaway";
  const showCutaway = phase === "cutaway" || phase === "cutting";
  // The container is the outermost layer, and it is only ever on screen while
  // it is the current view or on its way out
  const showContainer = phase === "container" || phase === "opening";

  return (
    <>
      <SceneCore />
      <CameraRig />
      <TourDriver />
      {/* Deliberately outside every Section and every layer group: the
          explanation's line is annotation, and it must not be tinted by the
          focus it is pointing at nor faded by a view cross-over. */}
      <ExplainArrow />

      {/* shared by both views, so it never fades on the cross-over */}
      <LayerContext.Provider value="shared">
        <Ground />
        {/* the stack stands outside the housing — it is the gas source, not
            part of the machine, and the tapping line reaches it through an
            opening in the wall */}
        <Section id={SECTION.SOURCE}>
          <Chimney />
        </Section>
        {/* the fan bank stands on its own legs and belongs to every view —
            it is plant bolted to the roof, not part of the housing */}
        <Section id={SECTION.DAC}>
          <DacFans />
        </Section>
        {/* the outermost layer. Deliberately outside a Section: it owns its
            own opacity, and a Section would overwrite it every frame */}
        {showContainer && <Enclosure />}
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
