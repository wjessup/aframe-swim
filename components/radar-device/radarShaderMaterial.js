

let radarVertexShader = `




varying float x;
varying float y;
varying float z;

void main() {





  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  y = worldPosition.y;
  x = worldPosition.x;
  z = worldPosition.z;
}
`
//varying vec2 vUv;
//varying vec3 vNormal;
//varying vec3 vPosition;
//  vPosition = position;
//  vNormal = normal;

//  vUv = uv;
//varying vec3 vNormal;
//varying vec3 vPosition;
//varying vec2 vUv;
//varying vec2 vUv2;


let radarFragmentShader = `

uniform vec3 color;
uniform float time;
uniform float centerX;
uniform float centerZ;
uniform float centerY;





float scanSpeed = 40.0;


float falloff = 6.0;
float sweepFadOutDelay = 3.0;
float effectFadeOutDelay = 1.0;



//radar lines
float maxOpacity = 0.4;
float lineWidth = 0.15;
float lineSeparation = 2.0;


varying float x;
varying float y;
varying float z;

varying float sweep;
varying float distToCamera;
uniform vec3 vertexPosition;

void main() {

  //###### background
  float sum = pow(x - centerX, 2.0) + pow(z - centerZ, 2.0) + pow(y - centerY, 2.0);
  float color = 0.4;
  float opacity = 0.4;

  //###### RADIAL FADE
  float edgeValue = 1500.0;
  float backgroundRadialFade = (edgeValue - sum)/edgeValue;
  opacity = min(opacity, backgroundRadialFade);


  //###### RADAR LINES SECTION
  float yy;
  float zz;
  float xx;

  if (mod(y, lineSeparation) < lineWidth) {
    yy = maxOpacity;
  } else {
    yy = 0.0;
  }

  if (mod(x, lineSeparation) < lineWidth) {
    xx = maxOpacity;
  } else {
    xx = 0.0;
  }

  if (mod(z, lineSeparation) < lineWidth) {
    zz = maxOpacity;
  } else {
    zz = 0.0;
  }

  float scanColor = max(zz,max(yy,xx));

  //###### ANIMATED PING SCAN
  float timeFract = fract(time/5.0); //once every 5 seconds
  float scanValue = pow(timeFract, 0.7) * 3400.0; //scan out at this speed
  float fadeScanVal = 400.0;

  if (scanValue > sum) {
    float colorMix = 0.2;
    colorMix = max(colorMix, scanColor);
    float opacityMix = 0.2;

    //###### FADE OVER TIME
    float scanMap = scanValue - sum;

      opacityMix = clamp( opacityMix - (scanMap - fadeScanVal)/(20.0*fadeScanVal) , 0.0, 0.2);
      colorMix = clamp( colorMix - (scanMap - fadeScanVal)/(20.0*fadeScanVal) , 0.0, colorMix);


    //###### BRIGHTER RADAR SCAN LINES


    color = color + colorMix;
    opacity = opacity + opacityMix;
  }



  //###### RADAR SCAN LINES
  if (scanValue > sum) {
    //color = color + max(zz,max(yy,xx));
  }


  gl_FragColor = vec4(
    color,
    0,
    color,
    opacity
  );

}
`

let radarMaterial = new THREE.ShaderMaterial({
  depthTest: false,
  side: THREE.DoubleSide,
  transparent: true,
  polygonOffset: true,
  polygonOffsetFactor: - 1,
  uniforms: {
    time: { value: 0.0 },
    centerY: { value: 0.0 },
    centerX: { value: 0.0 },
    centerZ: { value: 0.0 }
  },
  vertexShader: radarVertexShader,
  fragmentShader: radarFragmentShader

})

export default radarMaterial
