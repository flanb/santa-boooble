import addObjectDebug from '@/webgl/utils/addObjectDebug'
import { extendMaterial, getUniform, setUniform } from '@/webgl/utils/extendMaterial'
import Experience from 'core/Experience.js'
import { CanvasTexture, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import gsap from 'gsap'
import { RepeatWrapping } from 'three'
import { displayWriteButton } from '@/scripts/rive'
import { displayPaperText } from '@/script'

export default class Paper {
	constructor(parent) {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.resources = this.scene.resources

		this.#createModel()
		this.#createMaterial()
		if (this.experience.debug.active) this.#createDebug()
	}

	#createModel() {
		this.model = this.resources.items.paperModel.scene.clone()
		this.model.name = 'paper'
		this.model.class = this

		this.scene.add(this.model)

		requestAnimationFrame(() => {
			this.model.visible = false
		})
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
			}
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
		this.model.visible = true

		gsap.set('.paper-canvas textarea', {
			display: 'block',
			delay: 2,
		})

		gsap.to(this.material.userData.shader.uniforms.uTime, {
			duration: 129 / 60,
			value: 129 / 60,
			delay: 0.5,
		})

		let z = 0
		if (this.experience.sizes.width < 768) {
			z = this.experience.camera.instance.position.z - 6
		} else {
			z = this.experience.camera.instance.position.z - 3
		}
		// model get close to the camera
		gsap.to(this.model.position, {
			duration: 2,
			ease: 'power2.inOut',
			z,
			x: -0.55,
			y: -0.5,
			onComplete: () => {
				displayWriteButton()
			},
		})

		gsap.to(this.model.rotation, {
			duration: 2,
			ease: 'power2.inOut',
			x: 0,
			y: 0,
			z: 0,
		})

		setTimeout(() => {
			displayPaperText()
		}, 500)
	}
}
