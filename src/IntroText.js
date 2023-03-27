import * as THREE from "three";
/*eslint-disable */
global.THREE = THREE;
const createGeometry = require("three-bmfont-text");
import { createTextMaterial2 } from "./Text";

import starWarsMetrics from "./metrics.json";
/*eslint-enable */

export class IntroText {
  constructor(webgl, text) {
    this.webgl = webgl;
    this.text = text;

    this.container = new THREE.Group();
  }
  init() {
    const metrics = starWarsMetrics["introText"];
    const fontAssets = this.webgl.assets.fonts[metrics.font];
    const geometry = createGeometry({
      text: this.text,
      font: fontAssets.font,
      width: 600,
      flipY: fontAssets.glyphs.flipY,
      align: "left"
    });
    let material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: fontAssets.glyphs,
      transparent: true,
      side: THREE.DoubleSide
    });
    material = createTextMaterial2(
      fontAssets.glyphs,
      new THREE.Color(metrics.color)
    );
    let scale = this.webgl.getTextScale(
      Math.abs(fontAssets.font.info.size),
      metrics.fontSize
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(scale, -scale, 1);
    mesh.position.set(
      (-geometry.layout.width / 2) * scale,
      (-geometry.layout.height / 2) * scale,
      0
    );

    this.container.add(mesh);
  }
}
