import "./styles.css";
import * as THREE from "three";
import { loadTextAssets } from "./Text";
import { StarWarsOpening } from "./ScrollingText";
import { Stars } from "./Stars";
import { IntroText } from "./IntroText";
import text from "./text.json";
import { LightSaberTexture } from "./LightSaberTexture";
global.THREE = THREE;

/**
 *
 * https://github.com/Jam3/layout-bmfont-text/pull/5
 * Fog:
 * https://stackoverflow.com/questions/37243172/how-to-add-fog-to-texture-in-shader-three-js-r76
 */
console.clear();

export class App {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    document.body.append(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    this.camera.position.z = 50;
    this.scene = new THREE.Scene();
    // FogExp more realisting. Fog allows you to choose a specific distance
    // https://threejsfundamentals.org/threejs/lessons/threejs-fog.html
    this.scene.fog = new THREE.Fog(new THREE.Color("#000000"), 50, 80);

    this.clock = new THREE.Clock();

    this.mouse = { x: 0, y: 0 };
    this.raycaster = new THREE.Raycaster();
    this.hasMouseMoved = false;

    this.starWarsOpening = new StarWarsOpening(this, text.items);
    this.introText = new IntroText(this, text.intro);
    this.stars = new Stars(this);

    this.assets = {};

    this.tick = this.tick.bind(this);
    this.init = this.init.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);

    this.onResize = this.onResize.bind(this);
    this.loader = new Loader();
    this.loadAssets().then(this.init);
  }
  loadAssets() {
    const loader = this.loader;
    const assets = this.assets;
    return new Promise((resolve, reject) => {
      // this.starWarsOpening.loadAssets()
      loadTextAssets(assets, loader);

      loader.onComplete = () => {
        resolve();
      };
    });
  }
  createLightSaber() {
    let saberHeight = 1.2;
    let handleHeight = 0.4;
    let offColor = "#591113";
    let handleColor = "#848499";
    let geometry = new THREE.CylinderBufferGeometry(
      0.1,
      0.1,
      saberHeight,
      32,
      32
    );
    let material = new THREE.MeshBasicMaterial({
      color: offColor
    });
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.z += 30;
    mesh.position.y = -saberHeight / 2;

    let handleGeometry = new THREE.CylinderBufferGeometry(
      0.1,
      0.1,
      handleHeight,
      32,
      32
    );
    let handleMaterial = new THREE.MeshBasicMaterial({ color: handleColor });
    let handleMesh = new THREE.Mesh(handleGeometry, handleMaterial);
    handleMesh.position.z += 30;
    handleMesh.position.y += -saberHeight;

    const rotationGroup = new THREE.Group();
    rotationGroup.rotateZ(0.5);

    const lightSaberGroup = new THREE.Group();

    lightSaberGroup.add(rotationGroup);
    rotationGroup.add(mesh);
    rotationGroup.add(handleMesh);
    this.scene.add(lightSaberGroup);
    this.lightSaberGroup = lightSaberGroup;
  }
  onMouseUp() {
    if (!this.isMouseDown) return;
    this.isMouseDown = false;
    let rotationGroup = this.lightSaberGroup.children[0];
    rotationGroup.rotateZ(-0.2);
    rotationGroup.children[0].material.color.set("#591113");
    this.lightSaberTexture.disconnect();
  }
  onMouseDown() {
    this.isMouseDown = true;
    let rotationGroup = this.lightSaberGroup.children[0];
    rotationGroup.rotateZ(0.2);
    rotationGroup.children[0].material.color.set("#FF2D28");
  }
  getTextScale(sourceViewHeight, targetPixelHeight) {
    const viewSize = this.getViewSize();
    let sourcePixelsSize =
      (sourceViewHeight / viewSize.height) * window.innerHeight;
    return targetPixelHeight / sourcePixelsSize;
  }
  init() {
    this.introText.init();
    this.starWarsOpening.init();
    this.stars.init();
    this.createLightSaber();

    this.lightSaberTexture = new LightSaberTexture(
      this.starWarsOpening.width * 20,
      Math.abs(this.starWarsOpening.height * 20),
      10
    );
    this.lightSaberTexture.init();
    this.starWarsOpening.setTexture(this.lightSaberTexture.texture);
    // document.body.append(this.lightSaberTexture.canvas);

    // this.scene.add(this.introText.container);
    this.scene.add(this.starWarsOpening.rotatedContainer);
    this.scene.add(this.stars.mesh);

    this.tick();

    window.addEventListener("resize", this.onResize);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseout", this.onMouseUp);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousedown", this.onMouseDown);
  }
  toViewHeight(pixels) {
    const viewSize = this.getViewSize();
    return (pixels / window.innerHeight) * viewSize.height;
  }
  toViewWidth(pixels) {
    const viewSize = this.getViewSize();
    return (pixels / window.innerWidth) * viewSize.width;
  }
  initPrelude() {}
  getViewSize(depth = 0) {
    const fovInRadians = (this.camera.fov * Math.PI) / 180;
    const height = Math.abs(
      (this.camera.position.z - depth) * Math.tan(fovInRadians / 2) * 2
    );

    return { width: height * this.camera.aspect, height };
  }
  onMouseMove(ev) {
    this.mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;
    this.hasMouseMoved = true;
  }
  dispose() {
    this.disposed = true;
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("mouseout", this.onMouseUp);
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("mousedown", this.onMouseDown);
  }
  raycastLightSaber() {
    if (!this.hasMouseMoved || !this.isMouseDown) return;
    this.hasMouseMoved = false;
    const raycaster = this.raycaster;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    let intersections = raycaster.intersectObjects([
      this.starWarsOpening.interactivePlane
    ]);
    if (intersections.length > 0) {
      let intersection = intersections[0];
      this.lightSaberTexture.addPoint({
        x: intersection.uv.x,
        y: 1 - intersection.uv.y
      });
      // intersection.object.material.color.set(0x080808);
    } else {
      this.lightSaberTexture.disconnect();
      // this.starWarsOpening.interactivePlane.material.color.set(0x000000);
    }
  }
  update() {
    this.raycastLightSaber();

    const viewSizeAt30 = this.getViewSize(30);
    this.lightSaberGroup.position.x = this.mouse.x * viewSizeAt30.width * 0.5;
    this.lightSaberGroup.position.y = this.mouse.y * viewSizeAt30.height * 0.5;

    // this.stars.setHyperSpace(Math.sin(this.clock.getElapsedTime()) * 0.5 + 0.5);
    this.starWarsOpening.update();
  }
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  tick() {
    if (this.disposed) return;
    this.render();
    this.update();
    requestAnimationFrame(this.tick);
  }
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

class Loader {
  constructor() {
    this.items = [];
    this.loaded = [];
  }
  begin(name) {
    this.items.push(name);
  }
  end(name) {
    this.loaded.push(name);
    if (this.loaded.length === this.items.length) {
      this.onComplete();
    }
  }
  onComplete() {}
}
