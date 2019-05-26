
if (window.AFRAME != undefined) {
    var Component = function (el, id) {
        var self = this;
        this.el = el;
        this.el;
        this.id = id;
        this.attrName = this.name + (id ? '__' + id : '');
        this.el.components[this.attrName] = this;
        this.data = {};
    };

    var System = function (el) {
        var self = this;
        this.el = this.sceneEl = el;
        this.el.systems[this.name] = this;
    };

    AFRAME = {
        components: {},
        systems: {},
        registerShader: function () {}
    };

    AFRAME.registerComponent = function (name, definition) {
        var NewComponent;
        var proto = {};

        Object.keys(definition).forEach(function (key) {
            proto[key] = {
                value: definition[key],
                writable: true
            };
        });

        NewComponent = function (el, attr, id) {
            Component.call(this, el, attr, id);
        };

        NewComponent.prototype = Object.create(Component.prototype, proto);
        NewComponent.prototype.name = name;
        NewComponent.prototype.constructor = NewComponent;

        AFRAME.components[name] = NewComponent;
        return NewComponent;
    };

    AFRAME.registerSystem = function (name, definition) {
        var NewSystem;
        var proto = {};

        Object.keys(definition).forEach(function (key) {
            proto[key] = {
                value: definition[key],
                writable: true
            };
        });

        NewSystem = function (el, attr, id) {
            System.call(this, el, attr, id);
        };

        NewSystem.prototype = Object.create(System.prototype, proto);
        NewSystem.prototype.name = name;
        NewSystem.prototype.constructor = NewSystem;

        AFRAME.systems[name] = NewSystem;
        return NewSystem;
    };

    var fx = function(renderer, scene, cameras) {
        this.sceneEl = this;
        this.renderTarget = null;
        this.renderer = renderer;
        this.object3D = scene;
        this.cameras = Array.isArray(cameras) ? cameras : [cameras];
        this.components = {};
        this.systems = {};
        this.isPlaying = true;
        this.systems.effects = new AFRAME.systems.effects(this)
        this.systems.effects.init();
    };

    fx.prototype = Object.create({}, {
        chain: {
            value: function(chain) {
                var sys = this.systems.effects, self = this;
                var oldData = sys.data;
                sys.data = chain;
                sys.update(oldData);
                sys.tick(0,0);
            }
        },

        camera: {
            set: function(cameras) {
                this.cameras = Array.isArray(cameras) ? cameras : [cameras];
            },

            get: function () {
                return this.cameras[0];
            }
        },

        scene: {
            set: function(v) {
                this.object3D = v;
            },

            get: function () {
                return this.object3D;
            }
        },

        init: {
            value: function(name) {
                this.remove(name);
                var arr = name.split("__");
                var pro = AFRAME.components[arr[0]];
                if(!pro) return null;
                var obj = new pro(this, arr[1]);
                if(obj.schema.type || obj.schema.default) {
                    obj.data = obj.schema.default;
                } else {
                    for(var i in obj.schema) {
                        obj.data[i] = obj.schema[i].default;
                    }
                }
                if(obj.init) obj.init();
                if(obj.update) obj.update({});
                return obj;
            }
        },

        update: {
            value: function(name, data) {
                var obj = this.components[name];
                if(!obj) { obj = this.init(name); }
                if(!obj || data === undefined) return;

                var oldData = obj.data, nd = obj.data, schema = obj.schema;
                if (obj.schema.type || obj.schema.default) {
                    obj.data = data;
                } else {
                    oldData = {};
                    for(var o in nd) {
                        oldData[o] = nd[o];
                        if (data[o]) nd[o] = data[o];
                    }
                }
                if(obj.update) obj.update(oldData);
            }
        },

        remove: {
            value: function(name) {
                var obj = this.components[name];
                if(obj && obj.remove) { obj.remove(); }
                delete this.components[name];
            }
        },

        render: {
            value: function(time) {
                var behaviors = this.components;
                var sys = this.systems.effects;

                var timeDelta = this.time ? time - this.time : 0;
                this.time = time;

                for(var b in behaviors) {
                    var behavior = behaviors[b];
                    if (behavior.tick) behavior.tick(time, timeDelta);
                }

                sys.tick(time, timeDelta);
                sys.cameras = this.cameras;

                for(var b in behaviors) {
                    var behavior = behaviors[b];
                    if (behavior.tock) behavior.tock(time, timeDelta);
                }

                sys.tock(time, timeDelta);
            }
        }
    });
		console.log("here")
    window.AFRAME.Effects = fx;
}

AFRAME.registerSystem("effects", {
    schema: { type: "array", default: [] },

    init: function () {
        this.effects = {};
        this.passes = [];
        this._passes = [];
        this.cameras = [];
        this.setupPostState();
        this.needsOverride = true;
        this.lightComponents = [];
		this.LightState = {
			rows: 0,
			cols: 0,
			width: 0,
			height: 0,
			tileData: { value: null },
			tileTexture: { value: null },
			lightTexture: {
				value: new THREE.DataTexture( new Float32Array( 32 * 2 * 4 ), 32, 2, THREE.RGBAFormat, THREE.FloatType )
			},
		};
    },

    update: function () {
        this.needsUpdate = true;
    },

    addLight: function (behavior) {
		this.lightComponents.push(behavior);
	},

	removeLight: function (behavior) {
		var index = this.lightComponents.indexOf(behavior);
		this.lightComponents.splice(index);
    },

    setupPostState: function () {
        this.renderTarget = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat });
        this.renderTarget.texture.generateMipmaps = false;
        this.renderTarget.depthBuffer = true;
        this.renderTarget.depthTexture = new THREE.DepthTexture();
        this.renderTarget.depthTexture.type = THREE.UnsignedShortType;
        this.renderTarget.depthTexture.minFilter = THREE.LinearFilter;
        this.renderTarget.stencilBuffer = false;
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
        this.quad.frustumCulled = false;
        this.scene.add(this.quad);
        this.sceneLeft = new THREE.Scene();
        this.quadLeft = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
        this.quadLeft.geometry.attributes.uv.array.set([0, 1, 0.5, 1, 0, 0, 0.5, 0]);
        this.quadLeft.frustumCulled = false;
        this.sceneLeft.add(this.quadLeft);
        this.sceneRight = new THREE.Scene();
        this.quadRight = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
        this.quadRight.geometry.attributes.uv.array.set([0.5, 1, 1, 1, 0.5, 0, 1, 0]);
        this.quadRight.frustumCulled = false;
        this.sceneRight.add(this.quadRight);
        this.targets = [
            new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat }),
            new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat })
        ];

        this.tDiffuse = {type: "t", value: null};
        this.tDepth = {type: "t", value: this.renderTarget.depthTexture};
        this.cameraFar = {type: "f", value: 0};
        this.cameraNear = {type: "f", value: 0};
        this.time = { type: "f", value: 0 };
        this.timeDelta = { type: "f", value: 0 };
        this.uvClamp = { type: "v2", value: this.uvBoth };
        this.resolution = { type: "v4", value: new THREE.Vector4() };

    },

    vertexShader: [
        '#include <common>',
        'varying vec2 vUv;',
        'void main() {',
        '   vUv = uv;',
        '   gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
    ].join('\n'),

    uvLeft: new THREE.Vector2(0, 0.5),
    uvRight: new THREE.Vector2(0.5, 1),
    uvBoth: new THREE.Vector2(0, 1),

    parseToken: /([#a-z0-9\-\_]+)\.{0,1}([#a-z0-9\-\_]*)\s*\({0,1}\s*([\$a-z0-9\-\_\.\s]*)\){0,1}([\!\?]{0,1})/i,

    renderPass: function (material, renderTarget, viewCb, forceClear){
        var renderer = this.sceneEl.renderer;
        this.quad.material = material;
        var isFn = typeof viewCb === "function";
        var s = renderTarget || renderer.getSize();
        this.resolution.value.set(s.width, s.height, 1/s.width, 1/s.height);
        var oldClear = renderer.autoClear;
        renderer.autoClear = false;
        if (viewCb) {
            if (this.cameras.length > 1){
                this.quadLeft.material = material;
                this.uvClamp.value = this.uvLeft;
                setView(0, 0, Math.round(s.width * 0.5), s.height);
                if (isFn) viewCb(material, this.cameras[0], -1);
			    renderer.render(this.sceneLeft, this.camera, renderTarget, oldClear || forceClear);

                this.quadRight.material = material;
                this.uvClamp.value = this.uvRight;
                setView(Math.round(s.width * 0.5), 0, Math.round(s.width * 0.5), s.height);
                if (isFn) viewCb(material, this.cameras[1], 1);
                renderer.render( this.sceneRight, this.camera, renderTarget);

                this.uvClamp.value = this.uvBoth;
                setView(0, 0, s.width, s.height);
            } else {
                setView(0, 0, s.width, s.height);
                if (isFn) viewCb(material, this.sceneEl.camera, 0);
                renderer.render( this.scene, this.camera, renderTarget, oldClear || forceClear);
            }
        } else {
            setView(0, 0, s.width, s.height);
            renderer.render(this.scene, this.camera, renderTarget, oldClear || forceClear);
        }
        renderer.autoClear = oldClear;
        function setView(x,y,w,h) {
            if (renderTarget) {
                renderTarget.viewport.set( x, y, w, h );
				renderTarget.scissor.set( x, y, w, h );
            } else {
                renderer.setViewport( x, y, w, h );
				renderer.setScissor( x, y, w, h );
            }
        }
    },

    materialize: function (m) {
        var fs = [
            "uniform vec2 uvClamp;",
            "vec4 textureVR( sampler2D sampler, vec2 uv ) {",
            " return texture2D(sampler, vec2(clamp(uv.x, uvClamp.x, uvClamp.y), uv.y));",
            "} ",
            m.fragmentShader
        ].join("\n");

        m.uniforms.uvClamp = this.uvClamp;

        return new THREE.ShaderMaterial({
            uniforms: m.uniforms,
            vertexShader: m.vertexShader || this.vertexShader,
            fragmentShader: fs,
            depthWrite: false,
            depthTest: false,
            blending: THREE.NoBlending,
            fog: false,
            extensions: {
                derivatives: true
            },
            defines: m.defines || {}
        });
    },

    fuse: function (temp, alpha) {
        if (!temp.length) return;
        var self = this, count=0;
        var chunks = [], head = [], main = [], includes = {},
            needsDepth = false, needsDiffuse = false, k;

        var uniforms = {
            time: this.time,
            timeDelta: this.timeDelta,
            resolution: this.resolution
        };

        temp.forEach(function (obj) {
            var callMain = true, swapMain = false, args=[];
            if (typeof obj === "string") {
                var tok = self.parseToken.exec(obj);
                if(!tok) return;

                callMain = tok[4] !== "!";
                swapMain = tok[4] === "?";
                obj = tok[1];
                var prop = tok[2];
                var temp = {};

                if(obj[0] === "#") {
                    var el = document.querySelector(obj);
                    if(!el) return;

                    obj = {
                        attrName: [obj.replace("#", "script_"), "_", (count++), "_"].join(""),
                        fragment: prop ?
                            (el[prop] instanceof Document ? el[prop].body.textContent : el[prop])
                            : el.textContent,
                        depth: el.dataset.depth !== undefined,
                        diffuse: el.dataset.diffuse !== undefined,
                        includes: el.dataset.includes ? el.dataset.includes.trim().split(" ") : null,
                        defaults: el.dataset.defaults ? el.dataset.defaults.trim().split(" ") : null
                    };
                } else {
                    obj = self.effects[obj];
                    if (!obj) return;
                    if (prop) {
                        obj = obj.exports ? obj.exports[prop] : null;
                        if (!obj) return;
                        obj.attrName = tok[1] + "_" + prop + "_";
                    }
                }
                if (tok[3]) {
                    args = tok[3].trim().split(" ");
                }
            }
            var prefix = (obj.attrName ? obj.attrName : "undefined_" + (count++)) + "_";
            prefix = prefix.replace("__","_");
            if (obj.defaults) {
                obj.defaults.forEach(function (d, i) {
                    var v = args[i];
                    chunks.push(["#define $", i, " ", v  && v !== "$" ? v : d ].join("").replace(/\$/g, prefix).replace("__","_"));
                });
            }
            if (obj.diffuse) { needsDiffuse = true; }
            if (obj.depth) { needsDepth = true; }
            if (obj.fragment) { chunks.push(obj.fragment.replace(/\$/g, prefix)); }
            if (obj.uniforms) {
                for (var u in obj.uniforms) {
                    uniforms[prefix + u] = obj.uniforms[u];
                }
            };
            if (obj.includes) {
                obj.includes.forEach(function (inc) {
                    includes[inc] = true;
                });
            }
            if (callMain) {
                main.push(["  ", prefix, "main(", ( swapMain ? "origColor, color": "color, origColor"), ", vUv, depth);"].join(""));
            }
        });
        var t2u = { "i": "int", "f": "float", "t": "sampler2D",
            "v2": "vec2", "v3": "vec3", "c": "vec3","v4": "vec4",
            "m2": "mat2", "m3":"mat3", "m4": "mat4", "b": "bool" };

        for(k in includes) { head.push("#include <" + k + ">"); }

        var premain = [
            "void main () {"
        ];
        uniforms["tDiffuse"] = this.tDiffuse;

        if (needsDiffuse){
             premain.push("  vec4 color = texture2D(tDiffuse, vUv);");
        } else {
             premain.push("  vec4 color = vec4(0.0);");
        }
        premain.push("  vec4 origColor = color;");

        uniforms["tDepth"] = this.tDepth;
        uniforms["cameraFar"] = this.cameraFar;
        uniforms["cameraNear"] = this.cameraNear;

        if (needsDepth){
            premain.push("  float depth = texture2D(tDepth, vUv).x;");
        } else {
            premain.push("  float depth = 0.0;");
        }

        for(k in uniforms) {
            var u = uniforms[k];
            head.push(["uniform", t2u[u.type], k, ";"].join(" "));
        }

        head.push("varying vec2 vUv;");
        var source = [
            head.join("\n"), chunks.join("\n"), "\n",
                premain.join("\n"), main.join("\n"),
                alpha ? "  gl_FragColor = color;" : "  gl_FragColor = vec4(color.rgb, 1.0);", "}"
        ].join("\n");

        var material = this.materialize({
            fragmentShader: source,
            uniforms: uniforms
        });

        if(this.sceneEl.components.debug) console.log(source, material);
        return material;
    },

    rebuild: function () {
        var self = this, passes = [], temp = [];
        this.passes.forEach(function(pass){
            if (pass.dispose) pass.dispose();
        });
        this.data.forEach(function (k) {
            if(!k){
                pickup();
                return;
            }
            var obj, name;
            var tok = self.parseToken.exec(k);
            if(!tok || !tok[1]) return;
            name = tok[1];
            obj = self.effects[name];
            if (!obj){
                temp.push(k);
                return;
            }
            if (obj.pass) {
                pickup();
                passes.push({ pass: obj.pass, behavior: obj } );
            } else if (obj.material){
                pickup();
                passes.push({ pass: makepass(obj.material, false, obj.vr), behavior: obj });
            } else {
                temp.push(k);
            }
        });

        function pickup () {
            if (!temp.length) return;
            passes.push({ pass: makepass(self.fuse(temp), true)});
            temp = [];
        }

        function makepass (material, dispose, viewCb) {
            return {
                render: function(renderer, writeBuffer, readBuffer){
                    self.renderPass(material, writeBuffer, viewCb);
                },

                dispose: function () {
                    if (dispose) material.dispose();
                }
            }
        }
        pickup();
        this.needsUpdate = false;
        this.passes = passes;
    },

    isActive: function (behavior, resize) {
        var scene = this.sceneEl;
        if (behavior.bypass) return false;
        var isEnabled = scene.renderTarget ? true : false;
        if (!isEnabled) return false;
        if (resize && (this.needsResize || behavior.needsResize) && behavior.setSize) {
            var size = scene.renderer.getSize();
            behavior.setSize(size.width, size.height);
            delete behavior.needsResize;
        }
        return true;
    },

    register: function (behavior) {
        this.effects[behavior.attrName] = behavior;
        this.needsUpdate = true;
    },

    unregister: function (behavior) {
        delete this.effects[behavior.attrName];
        this.needsUpdate = true;
    },

    tick: function (time, timeDelta) {
        var self = this, sceneEl = this.sceneEl, renderer = sceneEl.renderer, effect = sceneEl.effect,
            rt = this.renderTarget, rts = this.targets, scene = sceneEl.object3D;
        if(!rt || !renderer) { return; }
        if (this.needsOverride) {
            if(scene.onBeforeRender) {
                scene.onBeforeRender = function (renderer, scene, camera) {
                    var size = renderer.getSize();
                    if (size.width !== rt.width || size.height !== rt.height) {
                        rt.setSize(size.width, size.height);
                        rts[0].setSize(size.width, size.height);
                        rts[1].setSize(size.width, size.height);
                        self.resolution.value.set(size.width, size.height, 1/size.width, 1/size.height);
                        self.needsResize = true;
                        self.resizeTiles();
                    }
                    if(camera instanceof THREE.ArrayCamera) {
                        self.cameras = camera.cameras;
                    } else {
                        self.cameras.push(camera);
                    }
                    self.tileLights(renderer, scene, camera);
                }
            } else {
                var rendererRender = renderer.render;
                renderer.render = function (scene, camera, renderTarget, forceClear) {
                    if (renderTarget === rt) {
                        var size = renderer.getSize();
                        if (size.width !== rt.width || size.height !== rt.height) {
                            rt.setSize(size.width, size.height);
                            rts[0].setSize(size.width, size.height);
                            rts[1].setSize(size.width, size.height);
                            self.resolution.value.set(size.width, size.height, 1/size.width, 1/size.height);
                            self.needsResize = true;
                        }
                        self.cameras.push(camera);
                    }
                    rendererRender.call(renderer, scene, camera, renderTarget, forceClear);
                }
            }
            this.needsOverride = false;
        }
        this.cameras = [];
        this.time.value = time / 1000;
        this.timeDelta.value = timeDelta / 1000;

        if (this.needsUpdate === true) { this.rebuild(); }

       this.setupPasses();

        this.tDiffuse.value = this.renderTarget.texture;
        this.tDepth.value = this.renderTarget.depthTexture;
        var camera = this.sceneEl.camera;
        this.cameraFar.value = camera.far;
        this.cameraNear.value = camera.near;
    },

    setupPasses : function () {
        var arr = [], rt = this.renderTarget;
        this.passes.forEach(function (p) {
            if (p.behavior && p.behavior.bypass === true) return;
            arr.push(p);
        });
        this.sceneEl.renderTarget = arr.length && this.sceneEl.isPlaying ? rt : null;
        this._passes = arr;
    },
    tock: function () {
        var scene = this.sceneEl, renderer = scene.renderer, self = this;
        if(!scene.renderTarget) { return; }
        var rt = scene.renderTarget, rts = this.targets;
        this._passes.forEach(function (pass, i) {
            var r = i ? rts[i & 1] : rt;
            self.tDiffuse.value = r.texture;
            if (pass.behavior && pass.behavior.resize) self.isActive(pass.behavior, true);
            pass.pass.render(renderer, i < self._passes.length - 1 ? rts[(i+1) & 1] : null, r);
        });
        this.needsResize = false;
    },

    resizeTiles: function () {
        var LightState = this.LightState;
        var width = LightState.width;
        var height = LightState.height;
        LightState.cols = Math.ceil( width / 32 );
        LightState.rows = Math.ceil( LightState.height / 32 );
        LightState.tileData.value = [ width, height, 0.5 / Math.ceil( width / 32 ), 0.5 / Math.ceil( height / 32 ) ];
        LightState.tileTexture.value = new THREE.DataTexture( new Uint8Array( LightState.cols * LightState.rows * 4 ), LightState.cols, LightState.rows );
    },

    tileLights: function ( renderer, scene, camera ) {
        if ( ! camera.projectionMatrix ) return;
        var LightState = this.LightState, lights = this.lightComponents;
        var size = renderer.getSize();
        var d = LightState.tileTexture.value.image.data;
        var ld = LightState.lightTexture.value.image.data;
        var viewMatrix = camera.matrixWorldInverse;
        d.fill( 0 );
        var vector = new THREE.Vector3();

        var passes;
        if(camera instanceof THREE.ArrayCamera) {
            passes = [ [0.5, 0, camera.cameras[0]], [0.5, 0.5, camera.cameras[1]]];
        } else {
            passes = [1.0, 0, camera];
        }
        passes.forEach(function(pass){
            lights.forEach( function ( light, index ) {
                vector.setFromMatrixPosition( light.el.object3D.matrixWorld );
                var pw = LightState.width * pass[0];
                var pm = LightState.width * pass[1];
                var bs = self.lightBounds( pass[2], vector, light.data.radius, pw );
                vector.applyMatrix4( viewMatrix );
                vector.toArray( ld, 4 * index );
                ld[ 4 * index + 3 ] = light.data.radius;
                light.data.color.toArray( ld, 32 * 4 + 4 * index );
                ld[ 32 * 4 + 4 * index + 3 ] = light.data.decay;
                if ( bs[ 1 ] < 0 || bs[ 0 ] > pw || bs[ 3 ] < 0 || bs[ 2 ] > LightState.height ) return;
                if ( bs[ 0 ] < 0 ) bs[ 0 ] = 0;
                if ( bs[ 1 ] > pw ) bs[ 1 ] = pw;
                if ( bs[ 2 ] < 0 ) bs[ 2 ] = 0;
                if ( bs[ 3 ] > LightState.height ) bs[ 3 ] = LightState.height;
                var i4 = Math.floor( index / 8 ), i8 = 7 - ( index % 8 );
                for ( var i = Math.floor( bs[ 2 ] / 32 ); i <= Math.ceil( bs[ 3 ] / 32 ); i ++ ) {
                    for ( var j = Math.floor( (bs[ 0 ] + pm) / 32  ); j <= Math.ceil( (bs[ 1 ] + pm) / 32 ); j ++ ) {
                        d[ ( LightState.cols * i + j ) * 4 + i4 ] |= 1 << i8;
                    }
                }
            } );
        });
        LightState.tileTexture.value.needsUpdate = true;
        LightState.lightTexture.value.needsUpdate = true;
    },

    lightBounds: function () {
        let v = new THREE.Vector3();
        return function ( camera, pos, r, w ) {
            var LightState = this.LightState;
            var minX = w, maxX = 0, minY = LightState.height, maxY = 0, hw = w / 2, hh = LightState.height / 2;
            for ( var i = 0; i < 8; i ++ ) {
                v.copy( pos );
                v.x += i & 1 ? r : - r;
                v.y += i & 2 ? r : - r;
                v.z += i & 4 ? r : - r;
                var vector = v.project( camera );
                var x = ( vector.x * hw ) + hw;
                var y = ( vector.y * hh ) + hh;
                minX = Math.min( minX, x );
                maxX = Math.max( maxX, x );
                minY = Math.min( minY, y );
                maxY = Math.max( maxY, y );
            }
            return [ minX, maxX, minY, maxY ];
    };
    }()
});


AFRAME.registerComponent("outline", {
	multiple: true,

    schema: {
		enabled: { default: true },
        color: { type: "color", default: "#000000" },
		width: { type: "vec2", default: new THREE.Vector2(1,1) },
		range: { type: "vec2", default: new THREE.Vector2(0,1500) },
		strength: {type: "number", default: 1},
		ratio: { type: "number", default: 0.5 },
		smooth: { default: false }
	},

    init: function () {
        this.system = this.el.sceneEl.systems.effects;
		var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
        this.renderTarget = new THREE.WebGLRenderTarget( 1, 1, pars );
		this.blurTarget = new THREE.WebGLRenderTarget( 1, 1, pars );
		this.needsResize = true;
		this.resolution = { type: "v4", value: new THREE.Vector4()};
		this.tockUniforms = {
			resolution: this.resolution,
            color: { type: "c", value: new THREE.Color() },
			width: { type: "v2", value: null },
			range: { type: "v2", value: null },
			strength: { type: "f", value: 1 }
        };

		this.blurDirection = { type: "v2", value: new THREE.Vector2()};

		this.exports = {
			sobel: {
				fragment: this.sobel,
				uniforms: this.tockUniforms,
				includes: ["packing"],
				depth: true
			},

			blur: {
				fragment: this.blur,
				uniforms: { resolution: this.tockUniforms.resolution, direction: this.blurDirection },
				diffuse: true
			}
		}
		this.currentMaterial = this.system.fuse([this.exports.sobel], true);


		this.blurMaterial = this.system.fuse([this.exports.blur], true);

		this.uniforms = {
			texture: { type: "t", value: this.renderTarget.texture }
		}

		this.system.register(this);
    },

    update: function (oldData) {
		this.bypass = !this.data.enabled;
        this.tockUniforms.color.value.set(this.data.color);
		this.tockUniforms.width.value = this.data.width;
		this.tockUniforms.range.value = this.data.range;
		this.tockUniforms.strength.value = 1 / this.data.strength;
    },

	setSize: function(w, h) {
		w = Math.round(w * this.data.ratio);
		h = Math.round(h * this.data.ratio);
		this.renderTarget.setSize(w,h);
		this.blurTarget.setSize(w,h);
		this.resolution.value.set(w, h, 1/w, 1/h);
	},

	tock: function () {
		if (!this.system.isActive(this, true)) return;
		this.system.renderPass(this.currentMaterial, this.renderTarget);
		this.system.tDiffuse.value = this.renderTarget;
		if (!this.data.smooth) return;
		this.blurDirection.value.set(1,0);
		this.system.renderPass(this.blurMaterial, this.blurTarget);
		this.system.tDiffuse.value = this.blurTarget;
		this.blurDirection.value.set(0,1);
		this.system.renderPass(this.blurMaterial, this.renderTarget);
	},

    remove: function () {
        this.system.unregister(this);
    },

    diffuse: true,

    sobel: [
		"mat3 $G[2];",

		"const mat3 $g0 = mat3( 1.0, 2.0, 1.0, 0.0, 0.0, 0.0, -1.0, -2.0, -1.0 );",
		"const mat3 $g1 = mat3( 1.0, 0.0, -1.0, 2.0, 0.0, -2.0, 1.0, 0.0, -1.0 );",


		"void $main(inout vec4 color, vec4 origColor, vec2 uv, float depth) {",

			"vec3 I[3];",
			"float cnv[2];",
			"float d;",

			"$G[0] = $g0;",
			"$G[1] = $g1;",

			"for (float i=0.0; i<3.0; i++)",
			"for (float j=0.0; j<3.0; j++) {",
		"           d = texture2D(tDepth, uv + resolution.zw * vec2(i-1.0,j-1.0) ).x;",
        "           d = perspectiveDepthToViewZ(d, cameraNear, cameraFar); ",
		"			I[int(i)][int(j)] = viewZToOrthographicDepth(d, cameraNear, cameraFar);",
			"}",

			"for (int i=0; i<2; i++) {",
				"float dp3 = dot($G[i][0], I[0]) + dot($G[i][1], I[1]) + dot($G[i][2], I[2]);",
				"cnv[i] = dp3 * dp3; ",
			"}",
			"color = vec4($color, sqrt(cnv[0]*cnv[0]+cnv[1]*cnv[1]));",
		"} "
	].join("\n"),

	blur: [
		"void $main(inout vec4 color, vec4 origColor, vec2 uv, float depth){",
		"color.a *= 0.44198;",
		"color.a += texture2D(tDiffuse, uv + ($direction * $resolution.zw )).a * 0.27901;",
		"color.a += texture2D(tDiffuse, uv - ($direction * $resolution.zw )).a * 0.27901;",
		"}"
	].join("\n"),

	fragment: [
        "void $main(inout vec4 color, vec4 origColor, vec2 uv, float depth){",
        "	vec4 texel = texture2D($texture, uv);",
		"   color.rgb = mix(color.rgb, texel.rgb, smoothstep(0.1,0.3,texel.a));",
        "}"
    ].join("\n")
});



AFRAME.registerComponent("fxaa", {
    schema: { default: true },

    init: function () {
        this.system = this.el.sceneEl.systems.effects;
        this.material = new THREE.ShaderMaterial({
            fragmentShader: FXAAShader.fragmentShader,
            vertexShader: FXAAShader.vertexShader,
            uniforms: {
                tDiffuse: this.system.tDiffuse,
                resolution: { type: 'v2', value: new THREE.Vector2() }
            }
        });
        this.system.register(this);
        this.needsResize = true;
    },

    update: function () {
        this.bypass = !this.data;
    },

    setSize: function (w, h) {
        this.material.uniforms.resolution.value.set(w, h);
    },

    resize: true,

    remove: function () {
        this.material.dispose();
        this.system.unregister(this);
    }
});

THREE.ShaderChunk[ 'lights_pars_maps' ] += [
	'#if defined TILED_FORWARD',
	'uniform vec4 tileData;',
	'uniform sampler2D tileTexture;',
	'uniform sampler2D lightTexture;',
	'#endif'
].join( '\n' );

THREE.ShaderChunk[ 'lights_fragment_maps' ] += [
	'',
	'#if defined TILED_FORWARD',
	'vec2 tUv = floor(gl_FragCoord.xy / tileData.xy * 32.) / 32. + tileData.zw;',
	'vec4 tile = texture2D(tileTexture, tUv);',
	'for (int i=0; i < 4; i++) {',
	'	float tileVal = tile.x * 255.;',
	'  	tile.xyzw = tile.yzwx;',
	'	if(tileVal == 0.){ continue; }',
	'  	float tileDiv = 128.;',
	'	for (int j=0; j < 8; j++) {',
	'  		if (tileVal < tileDiv) {  tileDiv *= 0.5; continue; }',
	'		tileVal -= tileDiv;',
	'		tileDiv *= 0.5;',
	'  		PointLight pointlight;',
	'		float uvx = (float(8 * i + j) + 0.5) / 32.;',
	'  		vec4 lightData = texture2D(lightTexture, vec2(uvx, 0.));',
	'  		vec4 lightColor = texture2D(lightTexture, vec2(uvx, 1.));',
	'  		pointlight.position = lightData.xyz;',
	'  		pointlight.distance = lightData.w;',
	'  		pointlight.color = lightColor.rgb;',
	'  		pointlight.decay = lightColor.a;',
	'  		getPointDirectLightIrradiance( pointlight, geometry, directLight );',
	'		RE_Direct( directLight, geometry, material, reflectedLight );',
	'	}',
	'}',
	'#endif'
].join( '\n' );

var utils = AFRAME.utils;

var CubeLoader = new THREE.CubeTextureLoader();
var texturePromises = {};

/**
 * Standard (physically-based) shader with tiled forward lighting.
 */
AFRAME.registerShader('standard-fx', {
  schema: {
    ambientOcclusionMap: {type: 'map'},
    ambientOcclusionMapIntensity: {default: 1},
    ambientOcclusionTextureOffset: {type: 'vec2'},
    ambientOcclusionTextureRepeat: {type: 'vec2', default: {x: 1, y: 1}},

    color: {type: 'color'},

    displacementMap: {type: 'map'},
    displacementScale: {default: 1},
    displacementBias: {default: 0.5},
    displacementTextureOffset: {type: 'vec2'},
    displacementTextureRepeat: {type: 'vec2', default: {x: 1, y: 1}},
    emissive: {type: 'color', default: '#000'},
    emissiveIntensity: {default: 1},
    envMap: {default: ''},

    fog: {default: true},
    height: {default: 256},

    metalness: {default: 0.0, min: 0.0, max: 1.0},
    metalnessMap: {type: 'map'},
    metalnessTextureOffset: {type: 'vec2'},
    metalnessTextureRepeat: {type: 'vec2', default: {x: 1, y: 1}},

    normalMap: {type: 'map'},
    normalScale: {type: 'vec2', default: {x: 1, y: 1}},
    normalTextureOffset: {type: 'vec2'},
    normalTextureRepeat: {type: 'vec2', default: {x: 1, y: 1}},

    offset: {type: 'vec2', default: {x: 0, y: 0}},
    repeat: {type: 'vec2', default: {x: 1, y: 1}},

    roughness: {default: 0.5, min: 0.0, max: 1.0},
    roughnessMap: {type: 'map'},
    roughnessTextureOffset: {type: 'vec2'},
    roughnessTextureRepeat: {type: 'vec2', default: {x: 1, y: 1}},

    sphericalEnvMap: {type: 'map'},
    src: {type: 'map'},
    width: {default: 512},
    wireframe: {default: false},
    wireframeLinewidth: {default: 2}
  },

  /**
   * Initializes the shader.
   * Adds a reference from the scene to this entity as the camera.
   */
  init: function (data) {
    this.material = new THREE.MeshStandardMaterial(getMaterialData(data));
    utils.material.updateMap(this, data);
    if (data.normalMap) { utils.material.updateDistortionMap('normal', this, data); }
    if (data.displacementMap) { utils.material.updateDistortionMap('displacement', this, data); }
    if (data.ambientOcclusionMap) { utils.material.updateDistortionMap('ambientOcclusion', this, data); }
    if (data.metalnessMap) { utils.material.updateDistortionMap('metalness', this, data); }
    if (data.roughnessMap) { utils.material.updateDistortionMap('roughness', this, data); }
    this.updateEnvMap(data);
	this.material.onBeforeCompile = function ( shader ) {
		shader.uniforms.tileData = State.tileData;
		shader.uniforms.tileTexture = State.tileTexture;
		shader.uniforms.lightTexture = State.lightTexture;
		shader.defines[ 'TILED_FORWARD' ] = 1;
	}
  },

  update: function (data) {
    this.updateMaterial(data);
    utils.material.updateMap(this, data);
    if (data.normalMap) { utils.material.updateDistortionMap('normal', this, data); }
    if (data.displacementMap) { utils.material.updateDistortionMap('displacement', this, data); }
    if (data.ambientOcclusionMap) { utils.material.updateDistortionMap('ambientOcclusion', this, data); }
    if (data.metalnessMap) { utils.material.updateDistortionMap('metalness', this, data); }
    if (data.roughnessMap) { utils.material.updateDistortionMap('roughness', this, data); }
    this.updateEnvMap(data);
  },

  /**
   * Updating existing material.
   *
   * @param {object} data - Material component data.
   * @returns {object} Material.
   */
  updateMaterial: function (data) {
    var material = this.material;
    data = getMaterialData(data);
    Object.keys(data).forEach(function (key) {
      material[key] = data[key];
    });
  },

  /**
   * Handle environment cubemap. Textures are cached in texturePromises.
   */
  updateEnvMap: function (data) {
    var self = this;
    var material = this.material;
    var envMap = data.envMap;
    var sphericalEnvMap = data.sphericalEnvMap;

    // No envMap defined or already loading.
    if ((!envMap && !sphericalEnvMap) || this.isLoadingEnvMap) {
      material.envMap = null;
      material.needsUpdate = true;
      return;
    }
    this.isLoadingEnvMap = true;

    // if a spherical env map is defined then use it.
    if (sphericalEnvMap) {
      this.el.sceneEl.systems.material.loadTexture(sphericalEnvMap, {src: sphericalEnvMap}, function textureLoaded (texture) {
        self.isLoadingEnvMap = false;
        texture.mapping = THREE.SphericalReflectionMapping;
        material.envMap = texture;
        utils.material.handleTextureEvents(self.el, texture);
        material.needsUpdate = true;
      });
      return;
    }

    // Another material is already loading this texture. Wait on promise.
    if (texturePromises[envMap]) {
      texturePromises[envMap].then(function (cube) {
        self.isLoadingEnvMap = false;
        material.envMap = cube;
        utils.material.handleTextureEvents(self.el, cube);
        material.needsUpdate = true;
      });
      return;
    }

    // Material is first to load this texture. Load and resolve texture.
    texturePromises[envMap] = new Promise(function (resolve) {
      utils.srcLoader.validateCubemapSrc(envMap, function loadEnvMap (urls) {
        CubeLoader.load(urls, function (cube) {
          // Texture loaded.
          self.isLoadingEnvMap = false;
          material.envMap = cube;
          utils.material.handleTextureEvents(self.el, cube);
          resolve(cube);
        });
      });
    });
  }
});

/**
 * Builds and normalize material data, normalizing stuff along the way.
 *
 * @param {object} data - Material data.
 * @returns {object} data - Processed material data.
 */
function getMaterialData (data) {
  var newData = {
    color: new THREE.Color(data.color),
    emissive: new THREE.Color(data.emissive),
    emissiveIntensity: data.emissiveIntensity,
    fog: data.fog,
    metalness: data.metalness,
    roughness: data.roughness,
    wireframe: data.wireframe,
    wireframeLinewidth: data.wireframeLinewidth
  };

  if (data.normalMap) { newData.normalScale = data.normalScale; }

  if (data.ambientOcclusionMap) { newData.aoMapIntensity = data.ambientOcclusionMapIntensity; }

  if (data.displacementMap) {
    newData.displacementScale = data.displacementScale;
    newData.displacementBias = data.displacementBias;
  }

  return newData;
}
