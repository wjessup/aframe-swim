let fragment = `

uniform vec3 color;
uniform float time;
uniform float centerX;
uniform float centerZ;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec2 vUv2;

float scanPeriod = 60.0;
float scan = 0.0;
float speed = 0.5;
float falloff = 6.0;
float sweepFadOutDelay = 3.0;
float effectFadeOutDelay = 5.0;
float edgeSpeed = 60.0;

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


  float fadeOut = pow((time - sweepFadOutDelay) * edgeSpeed, 2.0); //2 second delay on fadeout
  float maxedge = min(pow(time * edgeSpeed, 2.0), 3000.0);

  float val;

  //hard edge at max range, nothing beyond that
  if (maxedge < sum) {
    val = 0.0;
  } else {

    if((time - sweepFadOutDelay) < 0.0) {
      val = 1.0;
    } else {

      if (time > effectFadeOutDelay) { //after 4 seconds, fade the wole thing
        val = (sum/fadeOut)/(time - (effectFadeOutDelay - 1.0));
      } else {
        val = sum/fadeOut;
      }

    }
  }

  gl_FragColor = vec4(
    max(zz,max(yy,xx)),
    0,
    0,
    val
   );

}
`
export default fragment
