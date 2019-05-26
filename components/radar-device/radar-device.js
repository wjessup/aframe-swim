

//THIS COMPONENT JUST ATTACHES THE HTML
AFRAME.registerComponent('radar-device', {
  init: function () {
    console.log("starting radar device...")


    let html = `<a-box id="radar-hud" material="transparent: true; opacity: 0.5" depth="1" height="3" width="3" position="0 -3 -2" ></a-box>
              <a-sphere id="player-radar-indicator" color="yellow" radius="1"></a-sphere>

              <a-camera id="ortho-camera" orthogonal-camera active="false"></a-camera>
              <a-entity position="0 0 30" rotation="0 0 0">
                <a-camera radar-camera fov="100" far="80" active="false"></a-camera>
              </a-entity>`

    this.el.innerHTML = html
    //console.log(this.i)

    this.cameraToggle = false
    document.addEventListener('keyup', e => {
      if (e.keyCode == 13) {
        console.log("pressed Enter")
        this.cameraToggle = !this.cameraToggle
      }
    })


    console.log("radar device loaded...")
  },
  remove: function () {
    this.el.innerHTML = ''
  }
})




import radarMaterial from './radarShaderMaterial.js'
import { meshMap } from '../../utils.js'


//USE THIS ON A CAMERA TO PROJECT RADAR
AFRAME.registerComponent('radar-camera', {
  init: function () {
    console.log("starting radar camera...")


    this.clock = new THREE.Clock()
    this.camera = this.el.getObject3D('camera')
    this.camera.setViewOffset(800, 800, 0, 0, 800, 800)
    this.el.removeAttribute('position')
    this.el.removeAttribute('look-controls')
    this.el.removeAttribute('wasd-controls')

    this.mainCamera = document.querySelector('#main-camera')
    this.scene = document.querySelector('a-scene')

    this.bufferScene = new THREE.Scene()
    this.bufferTexture = new THREE.WebGLRenderTarget(800, 800)

    this.playerIndicator = document.querySelector('#player-radar-indicator')
    this.bufferScene.add(this.playerIndicator.object3D)

    let light = new THREE.DirectionalLight(0xffffff)
    light.position.set(0, -0.1, 1).normalize()
		this.bufferScene.add(light)


    let landClone = document.querySelector('#land-model').getObject3D('mesh').clone()
    landClone.scale.set(20, 20, 20)
    landClone.updateMatrix()

    meshMap(landClone, node => {
      node.geometry.clearGroups();
      node.geometry.addGroup( 0, Infinity, 0 );
      node.geometry.addGroup( 0, Infinity, 1 );
      node.material = [radarMaterial]
    })

    this.bufferScene.add(landClone)

    let plane = new THREE.PlaneGeometry(3, 3)
    let radarMesh = new THREE.MeshBasicMaterial({ map: this.bufferTexture.texture, transparent: true })
    let radarPlane = new THREE.Mesh(plane, radarMesh)
    radarPlane.position.set(0, 3 ,0)

    let radarHud = document.querySelector('#radar-hud')
    radarHud.object3D.add(radarPlane)

    console.log("radar camera loaded...")

  },
  tock: function (time, deltaTime) {

    this.playerIndicator.setAttribute('position', this.mainCamera.getAttribute('position'))

    radarMaterial.uniforms.centerY.value = this.mainCamera.getAttribute('position').y
    radarMaterial.uniforms.centerX.value = this.mainCamera.getAttribute('position').x
    radarMaterial.uniforms.centerZ.value = this.mainCamera.getAttribute('position').z
    radarMaterial.uniforms.time.value = this.clock.getElapsedTime();

    this.scene.renderer.setRenderTarget(this.bufferTexture)
    //this.scene.renderer.render(this.bufferScene, this.cameraToggle ? this.perspectiveCamera : this.orthoCamera)
    this.scene.renderer.render(this.bufferScene, this.camera)
    this.scene.renderer.setRenderTarget(null)


  }
})





/*
    this.cameraToggle = false
    document.addEventListener('keyup', e => {
      if (e.keyCode == 13) {
        console.log("pressed Enter")
        this.cameraToggle = !this.cameraToggle
      }
    })
    */
    //this.el.addEventListener('model-loaded', () => { this.run() })
    //document.querySelector('a-scene').addEventListener('loaded', () => { this.run() })
