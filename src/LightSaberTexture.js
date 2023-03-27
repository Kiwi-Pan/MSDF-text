import * as THREE from "three";
export class LightSaberTexture {
  constructor(width, height, radius) {
    this.width = width;
    this.height = height;
    this.radius = radius;

    this.last = null;
  }
  init() {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "LightSaberCanvas";
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d");
    this.clear();
    this.texture = new THREE.Texture(this.canvas);
    this.texture.needsUpdate = true;

    this.texture.generateMipmaps = false;
    this.texture.wrapS = this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.minFilter = THREE.LinearFilter;
  }
  clear() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  test() {
    const ctx = this.ctx;

    ctx.fillStyle = "#fafafa";
    ctx.beginPath();
    ctx.arc(this.width / 2, this.height / 2, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(this.width, this.height / 2, 30, 0, Math.PI * 2);
    ctx.fill();
  }
  disconnect() {
    this.last = null;
  }
  addPoint(point) {
    let pos = {
      x: point.x * this.width,
      y: point.y * this.height
    };
    if (!this.last) {
      this.last = pos;
    }
    const ctx = this.ctx;

    ctx.lineCap = "round";

    const offset = this.width * 5;
    ctx.shadowOffsetX = offset; // (default 0)
    ctx.shadowOffsetY = offset; // (default 0)
    ctx.shadowBlur = this.radius * 0.6; // (default 0)
    ctx.shadowColor = `rgba(255,255,255,1)`; // (default transparent black)

    ctx.strokeStyle = "rgba(255,0,0,1)";
    ctx.lineWidth = this.radius;

    ctx.beginPath();
    ctx.moveTo(this.last.x - offset, this.last.y - offset);
    ctx.lineTo(pos.x - offset, pos.y - offset);
    ctx.stroke();

    this.last = pos;

    this.texture.needsUpdate = true;
  }
}
