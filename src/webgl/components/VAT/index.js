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
		// this.scene.physicsWorld.removeCollider(this.collider)
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
		const modelBody = this.scene.physicsWorld.createRigidBody(
			RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 0, 0).setCanSleep(false)
		)
		const modelShape = RAPIER.ColliderDesc.ball(1).setTranslation(-0.1, -0.2, 0)
		this.collider = this.scene.physicsWorld.createCollider(modelShape, modelBody)
		this.scene.dynamicBodies.set(this.model, modelBody)

		const holderBody = this.scene.physicsWorld.createRigidBody(
			RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 0, 0).setCanSleep(false)
		)
		const holderShape = RAPIER.ColliderDesc.cuboid(0.3, 1.25, 0.3).setTranslation(0, 2.1, 0)
		this.scene.physicsWorld.createCollider(holderShape, holderBody)
		this.scene.dynamicBodies.set(this.holder, holderBody)

		//joints
		const baseBody = this.scene.physicsWorld.createRigidBody(
			RAPIER.RigidBodyDesc.fixed().setTranslation(0, 3, 0).setCanSleep(false)
		)
		const fixedJoint = RAPIER.JointData.spherical({ x: 0.0, y: 0.0, z: 0.0 }, { x: 0.0, y: 3.0, z: 0.0 })
		this.scene.physicsWorld.createImpulseJoint(fixedJoint, baseBody, holderBody)

		const sphericalJoint = RAPIER.JointData.spherical({ x: 0.0, y: 1, z: 0 }, { x: 0.0, y: 1, z: 0.0 })
		this.scene.physicsWorld.createImpulseJoint(sphericalJoint, modelBody, holderBody)

		const mouseBody = this.scene.physicsWorld.createRigidBody(
			RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0).setCanSleep(false)
		)
		const mouseShape = RAPIER.ColliderDesc.cuboid(0.1, 0.1, 2)
		const mouseCollider = this.scene.physicsWorld.createCollider(mouseShape, mouseBody)

		const bounds = new Vector3()
		this.experience.camera.instance.getViewSize(10, bounds)

		addEventListener('mousedown', (event) => {
			//enable mouse physics
			mouseCollider.setEnabled(true)
		})

		addEventListener('mouseup', (event) => {
			mouseCollider.setEnabled(false)
		})
		addEventListener('mousemove', (event) => {
			const x = (event.clientX / window.innerWidth) * 2 - 1
			const y = -(event.clientY / window.innerHeight) * 2 + 1

			const vector = new Vector3(x * (bounds.x / 2), y * (bounds.y / 2), 0)

			mouseBody.setTranslation(vector)
		})
	}

	#createDebug() {
		const debugFolder = addObjectDebug(this.experience.debug.ui, this.model)
	}

	update() {
		// if (!this.material.userData.shader) return
		// setUniform(this.material, 'uTime', this.experience.time.elapsed / 1000)
	}
}
