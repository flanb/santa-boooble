import addObjectDebug from '@/webgl/utils/addObjectDebug'
import { extendMaterial, getUniform, setUniform } from '@/webgl/utils/extendMaterial'
import Experience from 'core/Experience.js'
import { Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import gsap from 'gsap'
import { NearestFilter } from 'three'
import { RepeatWrapping } from 'three'

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

		this.material = extendMaterial(
			new MeshStandardMaterial({
				side: 2,
				map: colorTexture,
				normalMap: normalMapTexture,
				roughnessMap: roughnessTexture,
			}),
			{
				uniforms: {
					uTime: { value: 0.3 },
					posTexture: { value: vatTexture },
					normalsTexture: { value: normalsTexture },
					totalFrames: { value: 130 },
					fps: { value: 60 },
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

		gsap.to('.paper', {
			duration: 0.5,
			autoAlpha: 1,
			delay: 2,
		})

		gsap.to(this.material.userData.shader.uniforms.uTime, {
			duration: 129 / 60,
			value: 129 / 60,
			delay: 0.5,
		})

		// model get close to the camera
		gsap.to(this.model.position, {
			duration: 2,
			ease: 'power2.inOut',
			z: this.experience.camera.instance.position.z - 2.5,
			x: -0.5,
			y: -0.5,
		})

		gsap.to(this.model.rotation, {
			duration: 2,
			ease: 'power2.inOut',
			x: 0,
			y: 0,
			z: 0,
		})
	}
}
