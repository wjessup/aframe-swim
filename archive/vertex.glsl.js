let vertex = `

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying float x;
varying float y;
varying float z;
varying float sweep;
varying float distToCamera;

void main() {
  vUv = uv;

  vPosition = position;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  y = worldPosition.y;
  x = worldPosition.x;
  z = worldPosition.z;
}
`
//  vNormal = normal;
export default vertex
