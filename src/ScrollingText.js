import * as THREE from "three";

import starWarsMetrics from "./metrics.json";

import { createTextMaterial2 } from "./Text";

global.THREE = THREE;
const createGeometry = require("three-bmfont-text");
export class ScrollingText {
  constructor(webgl, items) {
    this.webgl = webgl;
    this.items = items;

    this.debug = false;
    this.debugHeight = false;
    this.types = [];
    this.initialHeight = 0;
    this.height = 0;
    this.speed = 0.1;

    this.initiated = false;

    this.scrollContainer = new THREE.Group();
  }
  toViewWidth(pixels) {
    const viewSize = this.webgl.getViewSize();
    return (pixels / window.innerWidth) * viewSize.width;
  }
  getTextScale(sourceViewHeight, targetPixelHeight) {
    const viewSize = this.webgl.getViewSize();
    let sourcePixelsSize =
      (sourceViewHeight / viewSize.height) * window.innerHeight;
    return targetPixelHeight / sourcePixelsSize;
  }
  createItems() {
    let height = this.height;
    let items = this.items;
    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      let typeFunc = this.types[item.type];
      if (typeFunc) {
        let itemHeight = typeFunc(item, height);
        height += itemHeight;
        if (this.debugHeight) this.debugHeight(height);
      } else {
        console.error("NO TYPE MATCHED: ", item.type, i);
      }
    }
    this.height = height;
  }
  init() {
    this.createItems();
    this.scrollContainer.position.y = this.initialHeight;

    // let rotated = new THREE.Group();
    // rotated.rotateX(-1);
    // rotated.add(this.scrollContainer)
    // this.webgl.scene.add(rotated);
    this.initiated = true;
  }
  debugHeight(height) {
    const geo = new THREE.PlaneBufferGeometry(20, 0.1);
    const mat = new THREE.MeshBasicMaterial({ color: 0xfafafa });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = height;

    this.scrollContainer.add(mesh);
  }
  shouldReset(y) {
    return y > this.height;
  }
  update() {
    if (this.debug || !this.initiated) return;
    this.scrollContainer.position.y += this.speed;
    if (this.shouldReset(this.scrollContainer.position.y)) {
      this.scrollContainer.position.y = this.initialHeight;
    }
  }
}

export class StarWarsOpening extends ScrollingText {
  constructor(webgl, items) {
    super(webgl, items);
    this.types = {
      title: this.createTitle.bind(this),
      body: this.createBody.bind(this),
      episode: this.createEpisode.bind(this)
    };
    const viewSize = webgl.getViewSize();

    // this.debug = true;
    this.speed = 0.05;
    this.initialHeight = -viewSize.height / 1.5;

    this.uTexture = new THREE.Uniform(null);
    this.uScrollSize = new THREE.Uniform(new THREE.Vector2(0, 0));

    this.width = 0;
    // this.initialHeight = 0;
    this.debug = false;
    this.interactivePlane = null;
    this.debugInteractivePlane = false;
    this.rotatedContainer = new THREE.Group();
    this.rotatedContainer.rotateX(-1);
    this.rotatedContainer.add(this.scrollContainer);
  }
  update() {
    if (this.debug || !this.initiated) return;
    this.scrollContainer.position.y += this.speed;
    this.interactivePlane.position.y += this.speed;
    if (this.shouldReset(this.scrollContainer.position.y)) {
      this.scrollContainer.position.y = this.initialHeight;
      this.interactivePlane.position.y = this.height / 2 + this.initialHeight;
    }
    this.interactivePlane.updateMatrixWorld();
  }
  setTexture(tex) {
    this.uTexture.value = tex;
  }
  createInteractivePlane() {
    const geometry = new THREE.PlaneBufferGeometry(
      this.width,
      Math.abs(this.height),
      1,
      1
    );
    const material = new THREE.MeshBasicMaterial({ color: 0x282828 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z += -0.01;
    mesh.position.y = this.height / 2 + this.initialHeight;
    mesh.userData.name = "Scrolling";

    let rotationWrapper = new THREE.Group();
    rotationWrapper.add(mesh);
    rotationWrapper.rotateX(-1);

    if (this.debugInteractivePlane || true) {
      // this.webgl.scene.add(rotationWrapper);
    }
    rotationWrapper.updateMatrixWorld();
    // Odd, Using the mesh works just fine.
    // It correctly applies the rotation
    // - Correction. Only when the wrapper is added to the scene. Odd
    // - Findings. Because I believe render updates the matrix world automatrically
    //    If the item is not rendered. The object's chidlren dont get the
    //    transformation
    this.interactivePlane = mesh;
    // this.rotatedContainer.add(mesh);
  }
  init() {
    this.createItems();
    this.createInteractivePlane();

    this.uScrollSize.value.set(this.width, Math.abs(this.height));

    this.scrollContainer.position.y = this.initialHeight;
    this.initiated = true;
  }
  shouldReset(y) {
    return (
      y >
      -this.height +
        this.webgl.toViewHeight(starWarsMetrics.scrollPaddingBottom)
    );
  }
  setScaleAndPosition(mesh, scale, position) {
    if (false) {
      mesh.scale.x = scale;
      mesh.scale.y = -scale;
      mesh.position.y = position.y;
      mesh.position.x = position.x;
    } else {
      let geometry = mesh.geometry;
      // geometry.scale(-scale, scale,1.);
      // geometry.computeBoundingSphere();
      // geometry.translate(position.x, position.y, 0);
      for (let i = 0; i < geometry.attributes.position.count; i++) {
        geometry.attributes.position.array[i * 2 + 0] =
          geometry.attributes.position.array[i * 2 + 0] * scale + position.x;
        geometry.attributes.position.array[i * 2 + 1] =
          geometry.attributes.position.array[i * 2 + 1] * -scale + position.y;
      }
    }
  }
  createEpisode(item, height) {
    let itemHeight = 0;
    const metrics = starWarsMetrics["subtitle"];
    const fontAssets = this.webgl.assets.fonts[metrics.font];
    let scale = this.webgl.getTextScale(
      Math.abs(fontAssets.font.info.size),
      metrics.fontSize
    );
    const geometry = createGeometry({
      font: fontAssets.font,
      text: item.text,
      align: "center",
      flipY: fontAssets.glyphs.flipY
    });
    let material = new THREE.MeshBasicMaterial({
      map: fontAssets.glyphs,
      transparent: true,
      wireframe: true,
      color: 0xffffff
    });
    material = createTextMaterial2(
      fontAssets.glyphs,
      new THREE.Color(metrics.color),
      {
        uScrollSize: this.uScrollSize,
        uTexture: this.uTexture
      }
    );
    const mesh = new THREE.Mesh(geometry, material);
    this.setScaleAndPosition(mesh, scale, {
      x: (-geometry.layout.width / 2) * scale,
      y: height - geometry.layout.capHeight * scale
    });
    // mesh.scale.x = scale;
    // mesh.scale.y = -scale;
    // mesh.position.x = (-geometry.layout.width / 2) * scale;
    // mesh.position.y = height - geometry.layout.capHeight * scale;
    itemHeight +=
      -geometry.layout.capHeight * scale -
      this.webgl.toViewHeight(metrics.marginBottom);

    this.scrollContainer.add(mesh);

    this.width = Math.max(geometry.layout.width * scale, this.width);

    return itemHeight;
  }
  createTitle(item, height) {
    const metrics = starWarsMetrics["title"];

    let itemHeight = 0;
    const fontAssets = this.webgl.assets.fonts[metrics.font];
    let scale = this.webgl.getTextScale(
      Math.abs(fontAssets.font.info.size),
      metrics.fontSize
    );
    const geometry = createGeometry({
      font: fontAssets.font,
      text: item.text,
      align: "center",
      flipY: fontAssets.glyphs.flipY
    });
    let material = new THREE.MeshBasicMaterial({
      // map: fontAssets.glyphs,
      transparent: true,
      wireframe: true,
      color: 0xffffff
    });
    material = createTextMaterial2(
      fontAssets.glyphs,
      new THREE.Color(metrics.color),
      {
        uTexture: this.uTexture,
        uScrollSize: this.uScrollSize
      }
    );
    const mesh = new THREE.Mesh(geometry, material);

    this.setScaleAndPosition(mesh, scale, {
      x: (-geometry.layout.width / 2) * scale,
      y: height - geometry.layout.capHeight * scale
    });
    // mesh.scale.x = scale;
    // mesh.scale.y = -scale;
    // mesh.position.x = (-geometry.layout.width / 2) * scale;

    // mesh.position.y = height - geometry.layout.capHeight * scale;
    // this.debugHeight(height);

    itemHeight +=
      -geometry.layout.capHeight * scale -
      this.webgl.toViewHeight(metrics.marginBottom);

    this.width = Math.max(geometry.layout.width * scale, this.width);

    this.scrollContainer.add(mesh);
    return itemHeight;
  }
  createBody(item, height) {
    const metrics = starWarsMetrics["body"];
    let itemHeight = 0;
    const fontAssets = this.webgl.assets.fonts[metrics.font];
    let scale = this.webgl.getTextScale(
      Math.abs(fontAssets.font.info.size),
      metrics.fontSize
    );
    const geometry = createGeometry({
      font: fontAssets.font,
      text: item.text,
      width: 700,
      flipY: fontAssets.glyphs.flipY,
      align: "left",
      lineHeight: 50
    });
    let material = new THREE.MeshBasicMaterial({
      map: fontAssets.glyphs,
      transparent: true,
      wireframe: true,
      color: 0xffffff
    });
    material = createTextMaterial2(
      fontAssets.glyphs,
      new THREE.Color(metrics.color),
      {
        uScrollSize: this.uScrollSize,
        uTexture: this.uTexture
      }
    );
    const mesh = new THREE.Mesh(geometry, material);

    this.setScaleAndPosition(mesh, scale, {
      x: (-geometry.layout.width / 2) * scale,
      y:
        height -
        (geometry.layout.height -
          geometry.layout.capHeight +
          geometry.layout.xHeight / 2) *
          scale
    });
    // mesh.scale.setX(scale);
    // mesh.scale.setY(-scale);

    // mesh.position.x = (-geometry.layout.width / 2) * scale;

    // // Since it is scaled negative in the y-axis. The text grows to top.
    // // So we need to move it one line height -  heightOflastLine
    // mesh.position.y =
    //   height -
    //   (geometry.layout.height -
    //     geometry.layout.capHeight +
    //     geometry.layout.xHeight / 2) *
    //     scale;

    // this.debugHeight(height);

    itemHeight +=
      -(geometry.layout.height - geometry.layout.xHeight / 2) * scale;
    // this.debugHeight(height - (geometry.layout.height - geometry.layout.capHeight) * scale);
    // this.debugHeight(height + itemHeight);

    this.width = Math.max(geometry.layout.width * scale, this.width);

    this.scrollContainer.add(mesh);
    return itemHeight;
  }
}
