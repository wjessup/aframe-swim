
import { meshMap } from '../utils.js'

const getRandomNum = (max = 0, min = 0) => Math.floor(Math.random() * (max + 1 - min)) + min;


const RAYS = [
  // Set the rays : one vector for every potential direction

  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 0, -1),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(-1, 0, 0)

]

AFRAME.registerComponent('fish-flock', {
  init: function () {
    console.log("starting fish flock component...")
    this.creatures = []
    this.creatureMeshGroup = new THREE.Group()

    const creatureNum = 80
    this.numTargets = 10



    this.targets = []
    this.avoidDistance = 3

    this.params = {
        maxSpeed: .015,
        seek: {
            maxForce: .01
        },
        align: {
            effectiveRange: 8,
            maxForce: .001
        },
        separate: {
            effectiveRange: 1.5,
            maxForce: .004
        },
        cohesion: {
            effectiveRange: 1
        }
    }




    //add bounding box to scene
    this.boundingBox = new THREE.Mesh(
      new THREE.BoxGeometry(50, 25, 50, 10, 10, 10),
      //new THREE.BoxGeometry(20, 15, 20, 10, 10, 10),
      new THREE.MeshBasicMaterial({ wireframe: true, side: THREE.DoubleSide })
    )
    this.boundingBox.position.set(0, -5, -5)
    this.el.sceneEl.object3D.add(this.boundingBox)

    //add ball to avoid to scene
    this.collidableMeshList = [];
    this.collidableMeshList.push(this.boundingBox)


    this.modelLoaded = false
    document.querySelector('#land-model').addEventListener('model-loaded', () => {
      let land = document.querySelector('#land-model').getObject3D('mesh')

      meshMap(land, node => {
        //this.collidableMeshList.push(node)
      })

      this.modelLoaded = true
      console.log("Land model loaded!")
    })


    this.spawnFish(creatureNum)

  },

  spawnFish: function(num) {

      let width = (this.boundingBox.geometry.parameters.width - this.avoidDistance*2)/2
      let height = (this.boundingBox.geometry.parameters.height - this.avoidDistance*2)/2
      let depth = (this.boundingBox.geometry.parameters.depth - this.avoidDistance*2)/2


      //add fish
      for (let i = 0; i < num; i++) {


              //var promise = new Promise(function(resolve, reject) {

                          let loader = new THREE.GLTFLoader()
                          //loader.setResponseType('arraybuffer')

                          loader.load('../models/fish2/scene.glb', (gltf) => {
                            console.log("LOADER... FISH... ", gltf.scene)

                            //this.creatures.forEach(creature => creature.setModel(gltf))

                            const creature = new Creature()
                            creature.mesh = gltf.scene


                            creature.mesh.scale.set(.15,.15,.15)
                            creature.animations = gltf.animations
                            creature.mesh.position.x = getRandomNum(width, -width)
                            creature.mesh.position.y = getRandomNum(height, -height)
                            creature.mesh.position.z = getRandomNum(depth, -depth)
                            creature.mesh.position.add(this.boundingBox.position)
                            creature.velocity = new THREE.Vector3(getRandomNum(1, -1) * 0.3, getRandomNum(1, -1) * 0.3, getRandomNum(1, -1) * 0.3);
                            creature.clock = new THREE.Clock()
                            creature.clock.start()
                            creature.mixer = new THREE.AnimationMixer(creature.mesh);

                            // Play a specific animation
                            var clip = THREE.AnimationClip.findByName(creature.animations, 'ArmatureAction')
                            var action = creature.mixer.clipAction( clip );
                            action.play();

                            this.creatureMeshGroup.add(creature.mesh)
                            this.creatures.push(creature)

                          }, undefined, (error) => {
                            var message = (error && error.message) ? error.message : 'Failed to load glTF model';
                            console.log(message)
                          })



              //  resolve("Stuff worked!");

              //});

      }

      //add targets
      for (let i = 0; i < this.numTargets; i++) {
        this.spawnTarget()
      }

      this.el.object3D.add(this.creatureMeshGroup)
  },

  spawnTarget: function() {
    let width = (this.boundingBox.geometry.parameters.width - this.avoidDistance*2)/2
    let height = (this.boundingBox.geometry.parameters.height - this.avoidDistance*2)/2
    let depth = (this.boundingBox.geometry.parameters.depth - this.avoidDistance*2)/2

    const geometry = new THREE.BoxGeometry(.2, .2, .2)
    const material = new THREE.MeshBasicMaterial({color: 0x00ff00})
    let box = new THREE.Mesh(geometry, material)


    box.position.x = getRandomNum(width, -width)
    box.position.y = getRandomNum(height, -height)
    box.position.z = getRandomNum(depth, -depth)
    box.position.add(this.boundingBox.position)
    this.targets.push(box)
    this.el.object3D.add(box)
  },

  destroyTarget: function(index) {
    let target = this.targets[index]

    //remove target
    target.geometry.dispose()
    target.material.dispose()
    this.el.object3D.remove(target)

    this.targets.splice(index,1) //remove item from array
  },


  tick: function() {
    //if (!this.fishLoaded) return

    this.creatures.forEach(creature => {

      var delta = creature.clock.getDelta() *2
      creature.mixer.update(delta)


       let steerVector = new THREE.Vector3()

       steerVector.add(this.align(creature))
       steerVector.add(this.separate(creature))
       steerVector.add(this.cohesion(creature))
       /*
        creature.applyForce(this.align(creature))
        creature.applyForce(this.separate(creature))
        creature.applyForce(this.cohesion(creature))
        */

        creature.getNearbyTarget(this.targets)


        //seek nearby food
        //console.log(creature.target)
        if (creature.target) {
            let target = this.targets[creature.target]
            //creature.applyForce(this.seek(creature, target.position.clone()))
            steerVector.add(this.seek(creature, target.position.clone(), .04))

            let dist = target.position.clone().manhattanDistanceTo(creature.mesh.position)
            if (dist < 1) {
                //clear target from ALL creatures with this target
                let index = creature.target
                this.creatures.forEach(creature => creature.clearTarget(index))

                //destory the object and fix array
                this.destroyTarget(index)

                //make 1 new one
                this.spawnTarget()
            }
        }


        //avoid land
        //if (this.modelLoaded) creature.applyForce(this.avoidLand(creature))
        if (this.modelLoaded) steerVector.add(this.avoidLand(creature))



        creature.update(steerVector.clone())
    })

  },


  avoidLand: function(creature) {

    let out = new THREE.Vector3(0, 0, 0)

    for (var i = 0; i < RAYS.length; i ++) {

      var caster = new THREE.Raycaster(
        creature.mesh.position,
        RAYS[i].clone().normalize(),
        0,
        this.avoidDistance
      )

      // Test if we intersect with any obstacle mesh
      var collisions = caster.intersectObjects(this.collidableMeshList, true);
      if ( collisions.length > 0 ) {
        //console.log( collisions[0].distance, collisions[0], RAYS[i] )

        let distanceScaledVector = 1/(Math.pow(collisions[0].distance, .6)) * .01
        out.sub(RAYS[i])
        out.multiplyScalar(distanceScaledVector)
      }
    }
    return out
  },

  seek: function(currentCreature, target, force = 0) {
      const maxSpeed = .01
      let maxForce = this.params.seek.maxForce;
      maxForce += force
      const toGoalVector = new THREE.Vector3();
      toGoalVector.subVectors(target, currentCreature.mesh.position);
      const distance = toGoalVector.length();
      toGoalVector.normalize();
      toGoalVector.multiplyScalar(maxSpeed);
      const steerVector = new THREE.Vector3();
      steerVector.subVectors(toGoalVector, currentCreature.velocity);
      // limit force
      if (steerVector.length() > maxForce) {
          steerVector.clampLength(0, maxForce);
      }
      return steerVector;
  },

  align: function(currentCreature) {
      const sumVector = new THREE.Vector3();
      let cnt = 0;
      const maxSpeed = this.params.maxSpeed;

      const maxForce = this.params.align.maxForce;
      const effectiveRange = this.params.align.effectiveRange;
      const steerVector = new THREE.Vector3();

      this.creatures.forEach(creature => {
          const dist = currentCreature.mesh.position.distanceTo(creature.mesh.position);
          if (dist > 0 && dist < effectiveRange) {
              sumVector.add(creature.velocity);
              cnt++;
          }
      });

      if (cnt > 0) {
          sumVector.divideScalar(cnt);
          sumVector.normalize();
          sumVector.multiplyScalar(maxSpeed);

          steerVector.subVectors(sumVector, currentCreature.velocity);
          // limit force
          if (steerVector.length() > maxForce) {
              steerVector.clampLength(0, maxForce);
          }
      }

      return steerVector;
  },

  separate: function(currentCreature) {
      const sumVector = new THREE.Vector3();
      let cnt = 0;
      //const maxSpeed = this.params.maxSpeed;
      const maxForce = this.params.separate.maxForce;
      const effectiveRange = this.params.separate.effectiveRange;
      const steerVector = new THREE.Vector3();

      this.creatures.forEach((creature) => {
          const dist = currentCreature.mesh.position.distanceTo(creature.mesh.position);
          if (dist > 0 && dist < effectiveRange) {
              let toMeVector = new THREE.Vector3();
              toMeVector.subVectors(currentCreature.mesh.position, creature.mesh.position);
              toMeVector.normalize();
              toMeVector.divideScalar(dist);
              sumVector.add(toMeVector);
              cnt++;
          }
      });

      if (cnt > 0) {
          sumVector.divideScalar(cnt);
          sumVector.normalize();
          //sumVector.multiplyScalar(maxSpeed);

          steerVector.subVectors(sumVector, currentCreature.velocity);
          // limit force
          if (steerVector.length() > maxForce) {
              steerVector.clampLength(0, maxForce);
          }
      }

      return steerVector;
  },

  cohesion: function(currentCreature) {

    const effectiveRange = 16
    let otherCreatures = this.creatures.filter(creature => creature != currentCreature)
    let nearCreatures = otherCreatures.filter(creature => currentCreature.mesh.position.distanceTo(creature.mesh.position) < effectiveRange)

    let positions = nearCreatures.map(creature => creature.mesh.position)
    let staringPoint = currentCreature.mesh.position.clone()
    let centerPoint = positions.reduce((acc, cur) => acc.add(cur), staringPoint)

    centerPoint.divideScalar(nearCreatures.length + 1)

    return this.seek(currentCreature, centerPoint)



    //TODO WHY THE HELL DOES THIS WORK OK?????
    return this.seek(currentCreature, center)
/*
    //MOVE TO CREATURE.UPDATE?
    const toGoalVector = new THREE.Vector3();
    toGoalVector.subVectors(center, currentCreature.mesh.position);
    const distance = toGoalVector.length();
    toGoalVector.normalize();
    toGoalVector.multiplyScalar(.015);
    const steerVector = new THREE.Vector3();
    steerVector.subVectors(toGoalVector, currentCreature.velocity);
    // limit force
    if (steerVector.length() > .02) {
        steerVector.clampLength(0, .02);
    }
    return steerVector;



choesin(currentCreature) {
        const sumVector = new THREE.Vector3();
        let cnt = 0;
        const effectiveRange = this.params.choesin.effectiveRange;
        const steerVector = new THREE.Vector3();

        this.creatures.forEach((creature) => {
            const dist = currentCreature.mesh.position.distanceTo(creature.mesh.position);
            if (dist > 0 && dist < effectiveRange) {
                sumVector.add(creature.mesh.position);
                cnt++;
            }
        })

        if (cnt > 0) {
            sumVector.divideScalar(cnt);
            steerVector.add(this.seek(currentCreature, sumVector));
        }

        return steerVector;
    }
*/

  },

  avoid: function(currentCreature, wall = new THREE.Vector3()) {

      currentCreature.mesh.geometry.computeBoundingSphere();
      const boundingSphere = currentCreature.mesh.geometry.boundingSphere;

      const toMeVector = new THREE.Vector3();
      toMeVector.subVectors(currentCreature.mesh.position, wall);

      const distance = toMeVector.length() - boundingSphere.radius * 2;
      const steerVector = toMeVector.clone();
      steerVector.normalize();
      steerVector.multiplyScalar(1 / (Math.pow(distance, 2)));

      return steerVector;
  }
})


class Creature {
    constructor() {

        //console.log( THREE.Cache.files['./models/fish2/scene.glb'] )
        const geometry = new THREE.CylinderGeometry(.1, .3, 1)
        geometry.rotateX(THREE.Math.degToRad(90));
        //geometry.scale(.4, .4, .4)
        //const color = new THREE.Color(`hsl(${getRandomNum(360)}, 100%, 50%)`);
        const material = new THREE.MeshBasicMaterial()
        //this.mesh = new THREE.Mesh(geometry, material);

        //this.acceleration = new THREE.Vector3();
        this.wonderTheta = 0;
        this.maxSpeed = .05
        this.hunger = 0
    }



    getNearbyTarget(targets) {

      if (this.target) return

      if (this.hunger < 40) return

      for(var i = 0; i < targets.length; i++) {

         let dist = targets[i].position.clone().manhattanDistanceTo(this.mesh.position)

         //distance is range 20 - 0
         if (dist < this.hunger/5) {
           //console.log("got new target, index = ", i)
           this.target = i
           //console.log("this target = " , this.target)
         }

      }
    }

    clearTarget(t) {
      //console.log("clearTarget called", t, this.target)
      if (this.target == t) {
        //console.log("cleared target")
        this.target = undefined
        this.hunger = 0
      }
    }

    update(steerVector) {


       this.hunger += .1
       if (this.hunger >= 99) {
         this.hunger = 90
       }

       this.trueSpeed = this.maxSpeed + this.hunger/1000

       //this.mesh.material.color = new THREE.Color(`rgb(100%, ${100 - Math.floor(this.hunger)}%, ${100 - Math.floor(this.hunger)}%)`)
       //console.log(this.mesh.material.color.opacity)
        // update velocity
        //this.velocity.add(this.acceleration);
        //console.log("this velcoity = ", this.velocity, steerVector)

        this.velocity.add(steerVector);
        //this.velocity.y = 0 //gives a way to clamp heigh change tho...
      //  console.log(this.mesh.rotation)

        this.velocity.normalize()
        //console.log("this velcoity = ", this.velocity)

        // limit velocity
        if (this.velocity.length() > this.trueSpeed) {
            this.velocity.clampLength(0, this.trueSpeed)
        }


        // update position
        this.mesh.position.add(this.velocity)

        // reset acc
        //this.acceleration.multiplyScalar(0)

        // head
        /*
        const head = this.velocity.clone();
        head.multiplyScalar(10);
        head.add(this.mesh.position);
        this.mesh.lookAt(head);
        */

        //rotate in direction of travel

        var axis = new THREE.Vector3(0, 0, 1)
        this.mesh.quaternion.setFromUnitVectors(axis, this.velocity.clone().normalize())

      //  let quat = this.mesh.quaternion.clone()
      //  quat.setFromUnitVectors(axis, this.velocity.clone().normalize())

    //  console.log(this.velocity)
    //  console.log(this.mesh.rotation)

      //  let velNorm = this.velocity.clone().normalize()

      //  let rEuler = this.mesh.rotation.clone().toVector3(velNorm)
      //  console.log(this.mesh.rotation)





    }

}






/*

cohesion: function(currentCreature) {
  const effectiveRange = 16
  let otherCreatures = this.creatures.filter(creature => creature != currentCreature)
  let nearCreatures = otherCreatures.filter(creature => currentCreature.mesh.position.distanceTo(creature.mesh.position) < effectiveRange)

  let staringPoint = currentCreature.mesh.position.clone()
  let center = (nearCreatures.length > 0) ? getCenterPoint(staringPoint, nearCreatures) : new THREE.Vector3()

  function getCenterPoint(staringPoint, nearCreatures) {
    let positions = nearCreatures.map(creature => creature.mesh.position)
    let centerPoint = positions.reduce((acc, cur) => acc.add(cur), staringPoint)

    centerPoint.divideScalar(nearCreatures.length+1)
    return centerPoint
  }
  return this.seek(currentCreature, center)
}

  */
