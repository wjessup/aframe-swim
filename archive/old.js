
//console.log("radarMaterial = ", radarMaterial)
/*
AFRAME.registerComponent('render-order', {
  schema: {type: 'number'},
  init: function () {
    this.el.addEventListener('model-loaded', () => { this.run() })

        this.el.object3D.renderOrder = this.data
        console.log(this.el.object3D.renderOrder)
  },
  run: function () {

    //console.log(this.el.renderOrder)
  },
  update: function () {
    this.el.object3D.renderOrder = this.data
    this.el.renderOrder = this.data
    this.mesh = this.el.getObject3D('mesh')
    console.log(this.mesh)

    meshMap(this.mesh, node => {
      node.renderOrder = this.data
    //  console.log(this.data)
      console.log(node.renderOrder)
    })

  }
})


AFRAME.registerComponent('wireframe', {
   dependencies: ['material'],
   init: function () {
     this.el.components.material.material.wireframe = true
   }
})

AFRAME.registerComponent('gltf-wireframe', {
 init: function () {
   this.el.addEventListener('model-loaded', () => { this.run() })
 },
 run: function () {
  const mesh = this.el.getObject3D('mesh')
   if (mesh) {
     mesh.traverse(node => {
       if (node.isMesh) {
         node.material.wireframe = true
       }
     })
   }
 }
})
*/




/*
      let renderPass = new THREE.RenderPass(bufferScene, cameraToggle ? perspectiveCamera : orthoCamera )
      var filmPass = new THREE.FilmPass(0.35, 0.025, 648, false)
      var dotScreenPass = new THREE.ShaderPass(THREE.DotScreenShader)



      composer = new THREE.EffectComposer(scene.renderer, bufferTexture)
      //composer.addPass(renderPass)


      //composer.addPass(filmPass)
      //dotScreenPass.renderToScreen = true
      //composer.addPass(dotScreenPass)
*/
