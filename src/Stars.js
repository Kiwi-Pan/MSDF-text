import * as THREE from "three";

export class Stars {
  constructor(webgl) {
    this.webgl = webgl;

    this.mesh = null;
  }
  init() {
    const geometry = new THREE.BufferGeometry();

    const positions = [];
    const mixes = [];
    const aColor = [];
    let starCount = 400;
    let range = 20;
    for (let i = 0; i < starCount; i++) {
      let x = Math.random() * range - range / 2;
      let y = Math.random() * range - range / 2;
      let z = Math.random() * 50;

      positions.push(x, y, z);
      positions.push(x, y, z + 0.1);

      mixes.push(0);
      mixes.push(1);
      let color = Math.random();
      aColor.push(color, color);
    }
    geometry.addAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.addAttribute("mixes", new THREE.Float32BufferAttribute(mixes, 1));
    geometry.addAttribute(
      "aColor",
      new THREE.Float32BufferAttribute(aColor, 1)
    );

    geometry.computeBoundingSphere();

    let material = new THREE.LineBasicMaterial({ linewidth: 1 });
    material = new THREE.ShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms: {
        uProgress: new THREE.Uniform(0)
      }
    });
    const mesh = new THREE.LineSegments(geometry, material);

    this.mesh = mesh;
  }
  setHyperSpace(progress) {
    this.mesh.material.uniforms.uProgress.value = progress;
  }
}

const vertexShader = `
attribute float mixes;
uniform float uProgress;
void main(){
    vec3 pos = position.xyz;
    pos.z += 100. * mixes * smoothstep(0.2,1.,uProgress * uProgress * uProgress) ;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.);
}
`;

const fragmentShader = `
void main(){
    vec3 color = vec3(1.);
    gl_FragColor = vec4(1.);
}
`;
