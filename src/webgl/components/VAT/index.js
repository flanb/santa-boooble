import { BoxGeometry, Mesh, ShaderMaterial, Vector3, NearestFilter, RGBAFormat, RepeatWrapping } from 'three'
import Experience from 'core/Experience.js'
import vertexShader from './vertexShader.vert'
import fragmentShader from './fragmentShader.frag'
import addObjectDebug from '@/webgl/utils/addObjectDebug'
import { extendMaterial, getUniform, setUniform } from '@/webgl/utils/extendMaterial'
import { MeshStandardMaterial } from 'three'
import RAPIER from '@dimforge/rapier3d-compat'

export default class VAT {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.resources = this.scene.resources

		this.#createModel()
		this.#createMaterial()
		this.#createInteraction()
		this.#createPhysics()
		if (this.experience.debug.active) this.#createDebug()
	}

	#createModel() {
		this.model = this.resources.items.ballModel.scene.clone()
		this.model.name = 'ball'

		this.holder = this.resources.items.holderModel.scene.clone()

		this.scene.add(this.model, this.holder)
	}

	#createMaterial() {
		const vatTexture = this.resources.items.ballPositionTexture
		const normalTexture = this.resources.items.ballNormalTexture
		const colorTexture = this.resources.items.ballColorTexture
		const roughnessTexture = this.resources.items.ballRoughnessTexture
		const displacementTexture = this.resources.items.ballDisplacementTexture

		this.material = extendMaterial(
			new MeshStandardMaterial({
				side: 2,
				map: colorTexture,
				metalness: 1,
				roughnessMap: roughnessTexture,
				normalMap: normalTexture,
				normalScale: new Vector3(10, 10),
				displacementMap: displacementTexture,
			}),
			{
				uniforms: {
					uTime: { value: 0.0067 },
					posTexture: { value: vatTexture },
					normalTexture: { value: normalTexture },
					totalFrames: { value: 60 },
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
					uniform sampler2D normalTexture;
				`,
					project_vertex: `
					float frame = (mod(uTime * fps, totalFrames-12. ) + 12.) / totalFrames ;

					// get the position from the texture
					float numWraps = 8.;
					vec4 texturePos = texture(posTexture, vec2(uv1.x, 1. - uv1.y + (1. - frame) / numWraps));
					// translate the position
					vec4 translated = vec4(position + texturePos.xzy, 1.0);
					vec4 mvPosition = modelViewMatrix * translated;
					gl_Position = projectionMatrix * mvPosition;
				`,
				},
			}
		)

		this.model.traverse((child) => {
			if (child.isMesh) {
				child.material = this.material
			}
		})
	}

	#createInteraction() {
		this.experience.interactionManager.addInteractiveObject(this.model)
		this.model.addEventListener('click', this.#playAnim)
	}

	#playAnim = () => {
		this.scene.physicsWorld.removeCollider(this.collider)
		this.scene.dynamicBodies.delete(this.model)
		this.model.quaternion.set(0, 0, 0, 1)

		const totalFrames = getUniform(this.material, 'totalFrames').value - 15
		const fps = getUniform(this.material, 'fps').value
		const duration = totalFrames / fps

		const startTime = this.experience.time.elapsed
		const animate = () => {
			const elapsedTime = (this.experience.time.elapsed - startTime) / 1000
			setUniform(this.material, 'uTime', elapsedTime)
			if (elapsedTime < duration) {
				requestAnimationFrame(animate)
			}
		}
		requestAnimationFrame(animate)
	}

	#createPhysics() {
		const cubeBody = this.scene.physicsWorld.createRigidBody(
			RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 5, 0).setCanSleep(false)
		)
		const cubeShape = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
		this.collider = this.scene.physicsWorld.createCollider(cubeShape, cubeBody)
		this.scene.dynamicBodies.set(this.model, cubeBody)
	}

	#createDebug() {
		const debugFolder = addObjectDebug(this.experience.debug.ui, this.model)
	}

	update() {
		console.log(this.model.quaternion)

		// if (!this.material.userData.shader) return
		// setUniform(this.material, 'uTime', this.experience.time.elapsed / 1000)
	}
}
