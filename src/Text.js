import * as THREE from "three";

global.THREE = THREE;
const loadFont = require("load-bmfont");
const parseXMLFont = require("parse-bmfont-xml");
const parseASCIIFont = require("parse-bmfont-ascii");

const noise2d = require("glsl-noise/simplex/2d.glsl");

const MSDFShader = require("three-bmfont-text/shaders/msdf");

const beVietnamRegularFont = require("./static/BeVietnamRegular.fnt");
const beVietnamRegularGlyphs = require("./static/BeVietnamRegular_0.png");
const latoFont = require("./static/Lato-Regular-64.fnt");
const latoGlyphs = require("./static/lato.png");

const barlowFont = require("./static/Barlow-SemiBold.json");
const barlowGlyphs = require("./static/Barlow-SemiBold.png");

const barlowCondensedFont = require("./static/BarlowCondensed-SemiBold.json");
const barlowCondensedGlyphs = require("./static/BarlowCondensed-SemiBold.png");

const fonts = [
  {
    name: "beVietnam",
    font: beVietnamRegularFont,
    glyphs: beVietnamRegularGlyphs
  },
  {
    name: "lato",
    font: latoFont,
    glyphs: latoGlyphs
  },
  {
    name: "barlow",
    font: barlowFont,
    glyphs: barlowGlyphs
  },
  {
    name: "barlowCondensed",
    font: barlowCondensedFont,
    glyphs: barlowCondensedGlyphs
  }
];
// https://github.com/mattdesl/parse-bmfont-xml
// Flip Y stuff https://github.com/mrdoob/three.js/issues/5644#issuecomment-63487671

let isURL = string => {
  return (
    typeof string === "string" &&
    string.indexOf("https://uploads.codesandbox.io") > -1
  );
};

const parseFont = data => {
  let result;
  if (typeof data === "object") {
    result = data;
  } else if (data.charAt(0) === "{") {
    result = JSON.parse(data);
  } else if (data.charAt(0) === "<") {
    result = parseXMLFont(data);
  } else {
    result = parseASCIIFont(data);
  }
  return result;
};

export const loadTextAssets = (assets, loader) => {
  assets.fonts = {};
  fonts.forEach(data => {
    assets.fonts[data.name] = {
      name: data.name
    };
    // Sometimes Codesandbox's parcel gives you an url.
    // Other times it gies you the raw file ¯\_(ツ)_/¯
    if (isURL(data.font)) {
      loader.begin("font-" + data.name);
      loadFont(data.font, (err, font) => {
        if (err) {
          console.error("Load Failed:", data.font, err);
          return;
        }
        loader.end("font" + data.name);
        assets.fonts[data.name].font = font;
      });
    } else {
      assets.fonts[data.name].font = parseFont(data.font);
    }
    loader.begin("glyphs-" + data.name);
    var glyphsLoader = new THREE.TextureLoader();
    glyphsLoader.crossOrigin = "";
    glyphsLoader.load(data.glyphs, glyphs => {
      assets.fonts[data.name].glyphs = glyphs;
      glyphs.flipY = false;
      loader.end("glyphs-" + data.name);
    });
  });
};

export const createTextMaterial = glyphs => {
  const mdsf = MSDFShader({
    transparent: true,
    side: THREE.DoubleSide,
    map: glyphs,
    color: "rgb(255,255,255)",
    negate: false
  });
  const material = new THREE.RawShaderMaterial({ ...mdsf });
  return material;
};

export const createTextMaterial2 = (glyphs, color, uniforms = {}) => {
  // const mdsf = MSDFShader({
  //   transparent: true,
  //   side: THREE.DoubleSide,
  //   map: glyphs,
  //   color: "rgb(255,255,255)",
  //   negate: false
  // });
  const material = new THREE.ShaderMaterial({
    fragmentShader,
    vertexShader,
    side: THREE.DoubleSide,
    transparent: true,
    // fog: true,
    uniforms: {
      uMap: new THREE.Uniform(glyphs),
      uColor: new THREE.Uniform(color),
      fogColor: { type: "c", value: new THREE.Color(0x000000) },
      fogNear: { type: "f", value: 50 },
      fogFar: { type: "f", value: 80 },
      ...uniforms
    }
  });
  return material;
};
const vertexShader = `
  varying vec2 vScrollUV;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec2 uScrollSize;
  void main(){
    vec3 pos = position.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.);
    vUv = uv;

    // Match position coordinates to UVs for the lightsaber cut
    vScrollUV = pos.xy / uScrollSize ;
    // vScrollUV = vec2(0.1,1.) ;
    vScrollUV.y = 1.-abs(vScrollUV.y);
    vScrollUV.x = vScrollUV.x + 0.5;

  }
`;

const fragmentShader = `

${noise2d}
#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif
  #define USE_FOG;
  uniform sampler2D uMap;
  varying vec2 vScrollUV;
  uniform vec3 uColor;  
  uniform sampler2D uTexture;
  uniform vec2 uScrollSize;
  varying vec2 vUv;
    uniform vec3 fogColor;
    uniform float fogNear;
    uniform float fogFar;

    float median(float r, float g, float b) {
      return max(min(r, g), min(max(r, g), b));
    }

  void main(){
    vec3 color = vec3(1.);
    color = uColor;
    vec4 sample = texture2D(uMap, vUv);
    float sigDist = median(sample.r, sample.g, sample.b) - 0.5;
     float alpha = clamp(sigDist/fwidth(sigDist) + 0.5, 0.0, 1.0);
     vec3 tex = texture2D(uTexture, vScrollUV).xyz;


     vec3 hotColor = vec3(1.,0.1,0.1);

     float size = 0.3;
     float cut = smoothstep(size,1., tex.r);
     float border = smoothstep(0.01,size, tex.r) * (snoise(vScrollUV*50.)*0.5+0.5);
      
    
     //  alpha *= 1.-cut;
     alpha *=   1.-cut ;

     color = mix(color, hotColor, border);

    // alpha = 1.;
    gl_FragColor = vec4(color,alpha);


      #ifdef USE_FOG
          #ifdef USE_LOGDEPTHBUF_EXT
              float depth = gl_FragDepthEXT / gl_FragCoord.w;
          #else
              float depth = gl_FragCoord.z / gl_FragCoord.w;
          #endif
          float fogFactor = smoothstep( fogNear, fogFar, depth );
          gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
      #endif
    if (gl_FragColor.a < 0.0001) discard;
  }
`;
