

let radarVertexShader = `

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float x;
varying float y;
varying float z;

void main() {
  vUv = uv;
  vNormal = normal;
  vPosition = position;


  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  y = worldPosition.y;
  x = worldPosition.x;
  z = worldPosition.z;
}
`


let radarFragmentShader = `

uniform vec3 color;
uniform float time;
uniform float centerX;
uniform float centerZ;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec2 vUv2;

float scanPeriod = 2.5;
float scan = 0.0;
float speed = 0.5;
float falloff = 6.0;
float sweepFadOutDelay = 3.0;
float effectFadeOutDelay = 5.0;
float edgeSpeed = 60.0;
float maxOpacity = 0.5;
float edgeValue = 1500.0;

varying float x;
varying float y;
varying float z;

varying float sweep;
varying float distToCamera;
uniform vec3 vertexPosition;

void main() {

  float yy = pow(fract(y - time * speed), falloff);
  float xx = pow(fract(x - time * speed), falloff);
  float zz = pow(fract(z - time * speed), falloff);



  float sum = pow(x - centerX, 2.0) + pow(z - centerZ, 2.0);


  //persistant max edge
  float maxedge = min(pow(time * edgeSpeed, 2.0), edgeValue);


  float val;


  //radial fade
  //hard edge at max range, nothing beyond that
  if (maxedge < sum) {
    val = 0.0;
  } else {
    val = (edgeValue - sum)/edgeValue;

    if (val > maxOpacity) {
      val = maxOpacity;
    }
  }
  val = min(max(zz,max(yy,xx)), val);


  gl_FragColor = vec4(
    max(zz,max(yy,xx)),
    0,
    max(zz,max(yy,xx)),
    val
   );

}
`

let radarMaterial  = new THREE.ShaderMaterial({
  depthTest: false,
  side: THREE.DoubleSide,
  transparent: true,
  polygonOffset: true,
  polygonOffsetFactor: - 1,
  uniforms: {
    time: { value: 0.0 },
    centerX: { value: 0.0 },
    centerZ: { value: 0.0 }
  },
  vertexShader: radarVertexShader,
  fragmentShader: radarFragmentShader

})

export default radarMaterial
