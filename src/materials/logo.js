import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

// The house mark, loaded once and shared by every vessel that carries it.
//
// It is the same asset as the favicon, so the plaque on the equipment and
// the browser tab can never drift apart.
//
// The SVG is rasterised into a canvas rather than handed straight to
// TextureLoader: an SVG element's intrinsic size is whatever the browser
// decides (this one reports 124x150), so uploading it directly gives a
// blurry, arbitrarily-sized texture — and some browsers refuse to upload an
// SVG image to WebGL at all. Drawing it ourselves fixes the resolution and
// works everywhere.
//
// Fixing it at 256 px was the mistake. The source is vector, so the raster
// costs nothing to make bigger, and the mark is not a small decal: it runs two
// thirds of the way up a container wall that fills the frame in the opening
// shot. At 256 px that is a handful of texels per centimetre of a letterform,
// which is why the hairlines in the globe broke up and the wordmark went soft.
// 2048 is about 16 MB of texture and reads clean right up against the wall.
const TEXTURE_HEIGHT = 2048;
const ASPECT = 464.78 / 564.2; // from the SVG's viewBox

let cached = null;
let pending = null;

function load() {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.height = TEXTURE_HEIGHT;
        canvas.width = Math.round(TEXTURE_HEIGHT * ASPECT);
        const ctx = canvas.getContext("2d");
        // The browser rasterises the SVG at whatever size it is drawn, so this
        // is a fresh render at full resolution rather than an upscale of the
        // intrinsic one — the whole reason for going through a canvas.
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        // Mipmapped and trilinear, which is what keeps the mark from crawling
        // when the camera pulls back — at this size the far view is sampling
        // one texel in eight.
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        cached = texture;
        resolve(texture);
      };
      // a missing logo must never break the scene
      image.onerror = () => resolve(null);
      image.src = `${import.meta.env.BASE_URL}favicon.svg`;
    });
  }
  return pending;
}

export function useLogoTexture() {
  const [texture, setTexture] = useState(cached);
  // Anisotropy is the other half of it, and the number that matters is the
  // hardware's rather than a guess: the mark is on a wall you see at a glancing
  // angle from most of the orbit, which is precisely the case a low anisotropy
  // setting smears. It was pinned at 4; most GPUs offer 16.
  const maxAnisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy());

  useEffect(() => {
    let alive = true;
    load().then((t) => {
      if (!alive || !t) return;
      if (t.anisotropy !== maxAnisotropy) {
        t.anisotropy = maxAnisotropy;
        t.needsUpdate = true;
      }
      setTexture(t);
    });
    return () => {
      alive = false;
    };
  }, [maxAnisotropy]);

  return texture;
}

export const LOGO_ASPECT = ASPECT;
