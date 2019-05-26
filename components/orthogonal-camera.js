AFRAME.registerComponent('orthogonal-camera', {
  update: function () {
    let width = window.innerWidth
    let height =  window.innerHeight

    let camera = new THREE.OrthographicCamera( -400, 400, 400, -400, -40, 100)
    camera.zoom = 10
    camera.updateProjectionMatrix()
    this.el.setObject3D('camera', camera)
  }
})
