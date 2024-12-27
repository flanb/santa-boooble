import addObjectDebug from '@/webgl/utils/addObjectDebug'
import { extendMaterial, getUniform, setUniform } from '@/webgl/utils/extendMaterial'
import RAPIER from '@dimforge/rapier3d-compat'
import Experience from 'core/Experience.js'
import { Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import Paper from '../Paper'

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
		this.model.add(this.holder)

		/**
		 * @type {Mesh}
		 */
		this.wireModel = this.resources.items.wireModel.scene.children[0]
		this.wireModel.rotateZ(Math.PI)
		this.scene.add(this.model, this.wireModel)
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

		const holderNormalTexture = this.resources.items.holderNormalTexture
		const holderRoughnessTexture = this.resources.items.holderRoughnessTexture

		const holderMaterial = new MeshStandardMaterial({
			color: 0xffd700,
			metalness: 1,
			normalMap: holderNormalTexture,
			side: 2,
			roughnessMap: holderRoughnessTexture,
		})

		this.model.traverse((child) => {
			if (child.isMesh) {
				if (child.name === 'export_mesh') {
					child.material = this.material
				} else if (child.name === 'gold_mesh') {
					child.material = holderMaterial
				}
			}
		})

		const wireColorTexture = this.resources.items.wireColorTexture
		const wireNormalTexture = this.resources.items.wireNormalTexture
		const wireRoughnessTexture = this.resources.items.wireRoughnessTexture
		const wireMetallicTexture = this.resources.items.wireMetallicTexture

		const wireMaterial = new MeshStandardMaterial({
			map: wireColorTexture,
			normalMap: wireNormalTexture,
			roughnessMap: wireRoughnessTexture,
			metalnessMap: wireMetallicTexture,
		})

		this.wireModel.traverseVisible((child) => {
			if (child.isMesh) {
				child.material = wireMaterial
			}
		})
	}

	#createInteraction() {
		this.experience.interactionManager.addInteractiveObject(this.model)
		this.model.addEventListener('click', this.#playAnim)
	}

	#playAnim = () => {
		this.model.removeEventListener('click', this.#playAnim)

		const paper = this.scene.getObjectByName('paper')
		paper.position.copy(this.model.position)
		paper.quaternion.copy(this.model.quaternion)
		paper.class.play()

		// this.scene.physicsWorld.removeCollider(this.modelCollider)
		// this.scene.dynamicBodies.delete(this.model)
		this.model.quaternion.set(0, 0, 0, 1)

		const totalFrames = getUniform(this.material, 'totalFrames').value - 15
		const fps = getUniform(this.material, 'fps').value
		const duration = totalFrames / fps

		const startTime = this.experience.time.elapsed
		const animate = () => {
			const elapsedTime = (this.experience.time.elapsed - startTime) / 2000
			setUniform(this.material, 'uTime', elapsedTime)
			if (elapsedTime < duration) {
				requestAnimationFrame(animate)
			}
		}
		requestAnimationFrame(animate)
	}

	#createPhysics() {
		const baseBody = this.scene.physicsWorld.createRigidBody(
			RAPIER.RigidBodyDesc.fixed().setTranslation(0, 3, 0)
		)

		const wireBody = this.scene.physicsWorld.createRigidBody(
			RAPIER.RigidBodyDesc.dynamic()
				.setRotation({
					x: this.wireModel.quaternion.x,
					y: this.wireModel.quaternion.y,
					z: this.wireModel.quaternion.z,
					w: this.wireModel.quaternion.w,
				})
				.setTranslation(0, 1, 0)
		)
		const wireShape = RAPIER.ColliderDesc.cuboid(0.3, 0.5, 0.1)
			.setRotation({
				x: this.wireModel.quaternion.x,
				y: this.wireModel.quaternion.y,
				z: this.wireModel.quaternion.z,
				w: this.wireModel.quaternion.w,
			})
			.setTranslation(0, 1, 0)
			.setMass(1)

		this.scene.physicsWorld.createCollider(wireShape, wireBody)
		this.scene.dynamicBodies.set(this.wireModel, wireBody)

		const lastBone = this.wireModel.getObjectByName('Bone005')
		const lastBoneQuat = new Quaternion()
		lastBone.getWorldQuaternion(lastBoneQuat)

		const lastBoneBody = this.scene.physicsWorld.createRigidBody(
			RAPIER.RigidBodyDesc.dynamic().setRotation({
				x: lastBoneQuat.x,
				y: lastBoneQuat.y,
				z: lastBoneQuat.z,
				w: lastBoneQuat.w,
			})
		)

		const lastBoneShape = RAPIER.ColliderDesc.cuboid(0.3, 0.3, 0.1)
			.setRotation({
				x: lastBoneQuat.x,
				y: lastBoneQuat.y,
				z: lastBoneQuat.z,
				w: lastBoneQuat.w,
			})
			.setMass(2)

		this.scene.physicsWorld.createCollider(lastBoneShape, lastBoneBody)
		this.scene.dynamicBodies.set(lastBone, lastBoneBody)

		const modelBody = this.scene.physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.dynamic())
		const modelShape = RAPIER.ColliderDesc.ball(1).setTranslation(-0.1, -0.2, 0).setMass(20)
		this.modelCollider = this.scene.physicsWorld.createCollider(modelShape, modelBody)
		this.scene.dynamicBodies.set(this.model, modelBody)

		//joints
		const baseJoint = RAPIER.JointData.revolute(
			{ x: 0, y: 0.5, z: 0 },
			{ x: 0, y: 0, z: 0 },
			{ x: 0, y: 0, z: 1 }
		)
		this.scene.physicsWorld.createImpulseJoint(baseJoint, baseBody, wireBody)

		const boneJoint = RAPIER.JointData.revolute(
			{ x: 0, y: 1.4, z: 0 },
			{ x: 0, y: -0.6, z: 0 },
			{ x: 0, y: 0, z: 1 }
		)
		this.scene.physicsWorld.createImpulseJoint(boneJoint, wireBody, lastBoneBody)

		const ballJoint = RAPIER.JointData.revolute(
			{ x: 0, y: 0.6, z: 0 },
			{ x: -0.1, y: 1.33, z: 0 },
			{ x: 0, y: 0, z: 1 }
		)
		this.scene.physicsWorld.createImpulseJoint(ballJoint, lastBoneBody, modelBody)

		const mouseBody = this.scene.physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.fixed())
		const mouseShape = RAPIER.ColliderDesc.cuboid(0.1, 0.1, 2)
		const mouseCollider = this.scene.physicsWorld.createCollider(mouseShape, mouseBody)
		mouseCollider.setEnabled(false)

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
		// const debugFolder = addObjectDebug(this.experience.debug.ui, this.model)
	}

	update() {
		// if (!this.material.userData.shader) return
		// setUniform(this.material, 'uTime', this.experience.time.elapsed / 1000)
	}
}
