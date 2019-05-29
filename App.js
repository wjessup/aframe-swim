import './components/hologram.js'
import './components/swim-controls.js'
import './components/orthogonal-camera.js'
import './components/radar-device/radar-device.js'
import hologramController from './actions/activateHologram.js'
import radarDeviceController from './actions/activateRadarDevice.js'
import STATE from './state.js'
import { meshMap } from './utils.js'






AFRAME.registerComponent('game-world', {
   init: function () {
     document.addEventListener('keyup', e => {
       console.log("KEYUP! App state = ", STATE)

       // 'q' key
       if (e.keyCode == 81) radarDeviceController()

       //'e' key
       if (e.keyCode == 69) hologramController()
       console.log("end of keyup")
     })


   },
   tick: function() {

   }
})

let collidableMeshList = [];
AFRAME.registerComponent('land-collider', {
  init: function () {


    this.el.addEventListener('model-loaded', () => { this.run() })
  },
  run: function() {
    console.log("land model loaded, starting collider...")

    let land = document.querySelector('#land-model').getObject3D('mesh')

    meshMap(land, node => {
      collidableMeshList.push(node)
    })

    console.log( collidableMeshList )

    document.querySelector('#main-camera').setAttribute('player-collider', '')

  }
})

AFRAME.registerComponent('player-collider', {
  init: function () {
    console.log("starting player collider...")

    this.mesh = this.el.object3D
    this.position = this.el.object3D.position


    // Set the rays : one vector for every potential direction
    this.rays = [
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(-1, 0, 0),
    ]



    this.land = document.querySelector('#land-model').getObject3D('mesh')

  },
  tick: function() {

    //console.log(this.position)
    // For each ray
    var collisions
    var scale = 0.1
  //  console.log(this.mesh.getWorldPosition(handVec))
    for (var i = 0; i < this.rays.length; i += 1) {

      let handVec = new THREE.Vector3()
      var caster = new THREE.Raycaster(
        this.mesh.getWorldPosition(handVec),
        this.rays[i],
        0,
        2
      )

      // Test if we intersect with any obstacle mesh
      collisions = caster.intersectObjects(collidableMeshList, true);
      if ( collisions.length > 0 ) {
        //console.log( collisions[0].distance, collisions[ 0 ].face.normal, this.rays[i] )

        this.position.x -= this.rays[i].x * (2.0 - collisions[0].distance)
        this.position.y -= this.rays[i].y * (2.0 - collisions[0].distance)
        this.position.z -= this.rays[i].z * (2.0 - collisions[0].distance)

      }


    }
  }
})
