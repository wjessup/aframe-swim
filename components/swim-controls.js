AFRAME.registerComponent('swim-controls', {
  init: function () {
/*
    document.querySelector('a-scene').addEventListener('loaded', () => { this.run() })
  },
  run: function() {
    */
    this.position = this.el.object3D.position
    this.rotation = this.el.object3D.rotation

    this.run = false
    this.scale = 0.2


    this.move = new THREE.Vector3()
    document.addEventListener('keydown', e => {
      //spacebar
      if (e.keyCode == 32) {
        console.log("pressed spacebar")
        this.move.x =   Math.sin(this.rotation.y) * Math.sin(this.rotation.x)
        this.move.z =  Math.sin(this.rotation.x) * Math.cos(this.rotation.y)
        this.move.y = Math.cos(this.rotation.x)
        this.run = true

      }
      //'c' key
      if (e.keyCode == 67) {
        this.move.x =  - Math.sin(this.rotation.y) * Math.sin(this.rotation.x)
        this.move.z =  - Math.sin(this.rotation.x) * Math.cos(this.rotation.y)
        this.move.y = - Math.cos(this.rotation.x)
        this.run = true
      }
    })
    document.addEventListener('keyup', e => {
      //spacebar
      if (e.keyCode == 32) {
        this.move = new THREE.Vector3()
        this.run = false
      }
      //'c' key
      if (e.keyCode == 67) {
        this.move = new THREE.Vector3()
        this.run = false
      }
    })

    console.log("swim controls loaded...")
    //this.setup = true
  },
  tick: function() {
    //if (!this.setup) return
    if (!this.run) return

    this.position.add(this.move.clone().multiplyScalar(this.scale))
/*
    this.position.x += this.move.x * this.scale
    this.position.y += this.move.y * this.scale
    this.position.z += this.move.z * this.scale
    */


  }
})
