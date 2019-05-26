

let vertexShader = `
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

let fragmentShader = `

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

AFRAME.registerComponent('hologram', {
  schema: {
    color: {
      type: 'color'
    }
  },

  init: function () {
    this.previousMaterials = {}

    this.material  = new THREE.ShaderMaterial({
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: - 10,
      uniforms: {
        time: { value: 0.0 },
        centerX: { value: 0.0 },
        centerZ: { value: 0.0 }
      },
      vertexShader,
      fragmentShader
    })


    this.el.addEventListener('model-loaded', () => { this.update() })
    this.clock = new THREE.Clock()
    //this.clock.start()
    this.centerX = 0
    this.centerY = 0
  },

  update: function () {
    const mesh = this.el.getObject3D('mesh')

    if (mesh) {
      mesh.traverse(node => {
        if (node.isMesh) {
          if (node.material.isGLTFSpecularGlossinessMaterial) {
            node.onBeforeRender = function () {}
          }
          this.previousMaterials[node.id] = node.material

          node.geometry.clearGroups();
          node.geometry.addGroup( 0, Infinity, 0 );
          node.geometry.addGroup( 0, Infinity, 1 );

          node.material = [node.material, this.material]
        }
      })
    }

    var camera = document.querySelector('#main-camera')
    console.log(camera.object3D.position)
    this.centerX = camera.object3D.position.x
    this.centerZ = camera.object3D.position.z

  },
  remove: function () {
    const mesh = this.el.getObject3D('mesh')
    if (mesh) {
      mesh.traverse(node => {
        if (node.isMesh) {
          node.material = this.previousMaterials[node.id]
        }
      })
    }

    this.el.removeEventListener('model-loaded', () => { this.update() })
  },
  tick: function (time, deltaTime) {
    this.material.uniforms.time.value = this.clock.getElapsedTime();

    this.material.uniforms.centerX.value = this.centerX
    this.material.uniforms.centerZ.value = this.centerZ
  }
})
