import addObjectDebug from '@/webgl/utils/addObjectDebug'
import { extendMaterial, getUniform, setUniform } from '@/webgl/utils/extendMaterial'
import Experience from 'core/Experience.js'
import { CanvasTexture, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import gsap from 'gsap'
import { RepeatWrapping } from 'three'

export default class Paper {
	constructor(parent) {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.resources = this.scene.resources
		this.parent = parent

		this.#createModel()
		// this.#createMaterial()
		if (this.experience.debug.active) this.#createDebug()
	}

	#createModel() {
		this.model = this.resources.items.paperModel.scene.children[0].clone()
		this.model.name = 'paper'
		this.model.class = this
		this.model.rotation.y = Math.PI / 2
		this.model.position.set(0, 2.1, 0)

		this.parent.model.add(this.model)
	}

	#createMaterial() {
		const vatTexture = this.resources.items.paperPositionTexture
		const normalsTexture = this.resources.items.paperNormalsTexture
		const colorTexture = this.resources.items.paperColorTexture
		const normalMapTexture = this.resources.items.paperNormalMapTexture
		normalMapTexture.repeat.set(2, 1)
		normalMapTexture.wrapS = normalMapTexture.wrapT = RepeatWrapping
		const roughnessTexture = this.resources.items.paperRoughnessTexture

		const canvasTexture = new CanvasTexture(document.getElementById('paper'))
		canvasTexture.flipY = false
		window.canvasTexture = canvasTexture
		this.material = extendMaterial(
			new MeshStandardMaterial({
				side: 2,
				map: colorTexture,
				color: 0xffffff,
				normalMap: normalMapTexture,
				roughnessMap: roughnessTexture,
			}),
			{
				defines: { USE_UV: '' },
				uniforms: {
					uTime: { value: 0.3 },
					posTexture: { value: vatTexture },
					normalsTexture: { value: normalsTexture },
					totalFrames: { value: 130 },
					fps: { value: 60 },
					textTexture: { value: canvasTexture },
				},
				vertexShader: {
					common: `
                    #include <common>
                    attribute vec2 uv1;
                    uniform float uTime;
                    uniform float totalFrames;
                    uniform float fps;
                    uniform sampler2D posTexture;
                    uniform sampler2D normalsTexture;
                `,
					project_vertex: `
                    float frame = mod(uTime * fps, totalFrames) / totalFrames ;

                    // get the position from the texture
                    float numWraps = 2.;
                    vec4 texturePos = texture(posTexture, vec2(uv1.x, 1. - uv1.y + (1. - frame) / numWraps));
                    vec4 textureNormal = texture(normalsTexture, vec2(uv1.x, 1. - uv1.y + (1. - frame) / numWraps)) * 2.0 - 1.0;
					vNormal = textureNormal.xzy;
                    // translate the position
                    vec4 translated = vec4(position + texturePos.xzy, 1.0);
                    vec4 mvPosition = modelViewMatrix * translated;
                    gl_Position = projectionMatrix * mvPosition;
                `,
				},
				fragmentShader: {
					common: `
					#include <common>
					uniform sampler2D textTexture;
				`,
					dithering_fragment: `
					#include <dithering_fragment>
					vec4 textColor = texture(textTexture, vUv);
					gl_FragColor.rgb *= (1. - textColor.rgb *0.9);
				`,
				},
			},
		)

		this.model.traverseVisible((child) => {
			if (child.isMesh) {
				child.material = this.material
			}
		})
	}

	#createDebug() {
		const debugFolder = addObjectDebug(this.experience.debug.ui, this.model)
	}

	play() {
		let z = 0
		if (this.experience.sizes.width < 768) {
			z = this.experience.camera.instance.position.z - 6
		} else {
			z = this.experience.camera.instance.position.z - 3
		}
		this.scene.attach(this.model)
		gsap.to(this.model.position, {
			duration: 2,
			ease: 'power2.inOut',
			z,
			x: 0,
			y: -0.25,
			onComplete: () => {
				// displayWriteButton()
			},
		})

		gsap.to(this.model.rotation, {
			duration: 2,
			ease: 'power2.inOut',
			y: Math.PI * 2 + Math.PI / 2,
			x: 0,
			z: 0,
		})
	}
}
