import addObjectDebug from '@/webgl/utils/addObjectDebug'
import { extendMaterial, getUniform, setUniform } from '@/webgl/utils/extendMaterial'
import RAPIER from '@dimforge/rapier3d-compat'
import Experience from 'core/Experience.js'
import {
	Euler,
	Group,
	Mesh,
	MeshPhysicalMaterial,
	MeshStandardMaterial,
	Quaternion,
	Vector2,
	Vector3,
} from 'three'
import { breakMode } from '@/scripts/rive'
import { toggleHoverCursor } from '@/scripts/cursor'
import gsap from 'gsap'

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
		this.model = new Group()
		this.ballModel = this.resources.items.ballModel.scene.children[0].clone()
		this.ballModel.name = 'ball'
		this.ballModel.rotation.y = Math.PI / 2
		this.ballModel.position.set(0, 0.2, 0)
		this.model.add(this.ballModel)

		this.armaModel = this.resources.items.armaModel.scene.children[0].clone()
		this.model.add(this.armaModel)
		this.armaModel.name = 'arma'
		this.armaModel.rotation.y = Math.PI / 2
		this.armaModel.position.set(0, 0.2, 0)

		// this.holder = this.resources.items.holderModel.scene.clone()
		// this.model.add(this.holder)

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
		normalTexture.flipY = false
		const colorTexture = this.resources.items.ballColorTexture
		const roughnessTexture = this.resources.items.ballRoughnessTexture
		const displacementTexture = this.resources.items.ballDisplacementTexture

		this.material = extendMaterial(
			new MeshPhysicalMaterial({
				side: 2,
				color: 0xff6e72,
				transmission: 1,
				opacity: 1,
				metalness: 0.4,
				roughness: 0.1,
				ior: 1.5,
				thickness: 0.4,
				dispersion: 0.5,
				// normalMap: normalTexture,
				// roughnessMap: roughnessTexture,
			}),
			{
				uniforms: {
					uTime: { value: 0.017 },
					posTexture: { value: vatTexture },
					totalFrames: { value: 30 },
					fps: { value: 30 },
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
					float frame = (mod(uTime * fps, totalFrames )) / totalFrames ;

					// get the position from the texture
					float numWraps = 6.;
					vec4 texturePos = texture(posTexture, vec2(uv1.x, 1. - uv1.y + (1. - frame) / numWraps));
					// translate the position
					vec4 translated = vec4(position + texturePos.xzy, 1.0);
					vec4 mvPosition = modelViewMatrix * translated;
					gl_Position = projectionMatrix * mvPosition;
				`,
				},
			},
		)
		const armaPosTexture = this.resources.items.armaPositionTexture
		const armaRoughnessTexture = this.resources.items.goldRoughnessTexture
		const armaNormalTexture = this.resources.items.goldNormalTexture
		const armaColorTexture = this.resources.items.goldColorTexture

		this.armaMaterial = extendMaterial(
			new MeshStandardMaterial({
				map: armaColorTexture,
				normalMap: armaNormalTexture,
				roughnessMap: armaRoughnessTexture,
				metalness: 1,
			}),
			{
				uniforms: {
					uTime: { value: 0.017 },
					posTexture: { value: armaPosTexture },
					totalFrames: { value: 30 },
					fps: { value: 30 },
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
					float frame = (mod(uTime * fps, totalFrames )) / totalFrames ;

					// get the position from the texture
					float numWraps = 10.;
					vec4 texturePos = texture(posTexture, vec2(uv1.x, 1. - uv1.y + (1. - frame) / numWraps));
					// translate the position
					vec4 translated = vec4(position + texturePos.xzy, 1.0);
					vec4 mvPosition = modelViewMatrix * translated;
					gl_Position = projectionMatrix * mvPosition;
				`,
				},
			},
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
				if (child.name === 'ball') {
					child.material = this.material
				} else if (child.name === 'gold_mesh') {
					child.material = holderMaterial
				} else if (child.name === 'arma') {
					child.material = this.armaMaterial
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
		let breakCount = 0
		this.experience.interactionManager.addInteractiveObject(this.model)
		this.model.addEventListener('click', () => {
			// this.mouseCollider.setEnabled(true)
			// console.log(this.mouseCollider.isEnabled());
			this.modelBody.applyImpulse(new RAPIER.Vector3(0, 0, -5), true)
			if (!breakMode) return
			breakCount++
			//radial gradient in center increasing
			if (breakCount === 1) {
				gsap.to(document.body, {
					duration: 1,
					background: 'radial-gradient(circle, rgb(255, 50, 50) -100%, rgb(255, 255, 255) 80%)',
				})
			}
			if (breakCount === 2) {
				gsap.to(document.body, {
					duration: 1,
					background: 'radial-gradient(circle,rgb(255, 50, 50) 0%, rgb(255, 255, 255) 80%)',
				})
			}
			if (breakCount === 3) {
				gsap.to(document.body, {
					duration: 1,
					background: 'radial-gradient(circle, rgb(255, 50, 50) 5%, rgb(255, 255, 255) 80%)',
				})
				this.#playAnim()
				gsap.to(document.body, {
					delay: 2,
					duration: 4,
					background: 'radial-gradient(circle,rgb(255, 50, 50) -100%, rgb(255, 255, 255) 80%)',
				})
			}
		})
		this.model.addEventListener('mouseenter', () => {
			if (!breakMode) return
			toggleHoverCursor(true)
		})
		this.model.addEventListener('mouseleave', () => {
			toggleHoverCursor(false)
		})
	}

	#playAnim = () => {
		this.model.removeEventListener('click', this.#playAnim)

		const paper = this.scene.getObjectByName('paper')
		// paper.position.copy(this.model.position)
		// paper.quaternion.copy(this.model.quaternion)
		paper.class.play()

		this.scene.attach(this.ballModel)
		this.scene.attach(this.armaModel)
		// this.ballModel.rotation.set(0, 0, 0)
		// this.armaModel.rotation.set(0, 0, 0)

		gsap.to([this.ballModel.rotation, this.armaModel.rotation], {
			x: 0,
			z: 0,
			duration: 0.75,
		})
		gsap.to([this.ballModel.position, this.armaModel.position], {
			y: '-=1',
			duration: 1,
		})

		this.modelBody.setEnabledRotations(false, true, true)

		const totalFrames = getUniform(this.material, 'totalFrames').value - 1
		const fps = getUniform(this.material, 'fps').value

		const duration = totalFrames / fps

		gsap.to([getUniform(this.material, 'uTime'), getUniform(this.armaMaterial, 'uTime')], {
			value: duration,
			ease: 'none',
			duration: 1,
			onComplete: () => {
				//delete arma model and ball model
				this.scene.remove(this.ballModel)
				this.scene.remove(this.armaModel)
			},
		})

		const value = this.baseBody.translation()
		gsap.to(value, {
			y: '+=2',
			duration: 5,
			delay: 2,
			ease: 'power2.inOut',
			onUpdate: () => {
				this.baseBody.setTranslation(value)
			},
			onComplete: () => {
				this.scene.enablePhysics = false
			},
		})
	}

	#createPhysics() {
		this.baseBody = this.scene.physicsWorld.createRigidBody(
			RAPIER.RigidBodyDesc.fixed().setTranslation(0, 3, 0),
		)

		this.wireBody = this.scene.physicsWorld.createRigidBody(
			RAPIER.RigidBodyDesc.dynamic()
				.setRotation({
					x: this.wireModel.quaternion.x,
					y: this.wireModel.quaternion.y,
					z: this.wireModel.quaternion.z,
					w: this.wireModel.quaternion.w,
				})
				.setTranslation(0, 3, 0)
				.setCanSleep(false),
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

		this.scene.physicsWorld.createCollider(wireShape, this.wireBody)
		this.scene.dynamicBodies.set(this.wireModel, this.wireBody)

		const lastBone = this.wireModel.getObjectByName('Bone005')
		const lastBoneQuat = new Quaternion()
		lastBone.getWorldQuaternion(lastBoneQuat)

		const lastBoneBody = this.scene.physicsWorld.createRigidBody(
			RAPIER.RigidBodyDesc.dynamic()
				.setRotation({
					x: lastBoneQuat.x,
					y: lastBoneQuat.y,
					z: lastBoneQuat.z,
					w: lastBoneQuat.w,
				})
				.setTranslation(2, 2, 0)
				.setCanSleep(false),
		)

		const lastBoneShape = RAPIER.ColliderDesc.cuboid(0.3, 0.2, 0.1)
			.setRotation({
				x: lastBoneQuat.x,
				y: lastBoneQuat.y,
				z: lastBoneQuat.z,
				w: lastBoneQuat.w,
			})
			.setMass(1)

		this.scene.physicsWorld.createCollider(lastBoneShape, lastBoneBody)
		this.scene.dynamicBodies.set(lastBone, lastBoneBody)
		const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

		/**
		 * @type {RAPIER.RigidBody} modelBody - The created dynamic rigid body.
		 */
		this.modelBody = this.scene.physicsWorld.createRigidBody(
			isMobile
				? RAPIER.RigidBodyDesc.dynamic().setCanSleep(false)
				: RAPIER.RigidBodyDesc.dynamic()
						.setTranslation(2, 2, 0)
						.setRotation({ x: 0, y: 0, z: 0.8, w: 0.6 })
						.setCanSleep(false),
		)
		const geometry = this.ballModel.geometry.clone()
		geometry.rotateY(Math.PI / 2)

		const modelShape = RAPIER.ColliderDesc.convexHull(geometry.attributes.position.array)
			.setTranslation(0, 0.2, 0)
			.setMass(1)
		// .setRotation(new Quaternion().setFromEuler(new Euler(0, Math.PI / 2, 0)))
		/**
		 * @type {RAPIER.Collider}
		 */
		this.modelCollider = this.scene.physicsWorld.createCollider(modelShape, this.modelBody)
		this.scene.dynamicBodies.set(this.model, this.modelBody)

		//joints
		this.baseJoint = RAPIER.JointData.revolute(
			{ x: 0, y: 0.5, z: 0 },
			{ x: 0, y: 0, z: 0 },
			{ x: 0, y: 0, z: 1 },
		)

		this.baseImp = this.scene.physicsWorld.createImpulseJoint(
			this.baseJoint,
			this.baseBody,
			this.wireBody,
		)

		const boneJoint = RAPIER.JointData.revolute(
			{ x: 0, y: 1.4, z: 0 },
			{ x: 0, y: -0.6, z: 0 },
			{ x: 0, y: 0, z: 1 },
		)
		const wireImp = this.scene.physicsWorld.createImpulseJoint(
			boneJoint,
			this.wireBody,
			lastBoneBody,
		)

		const ballJoint = RAPIER.JointData.revolute(
			{ x: 0, y: 0.6, z: 0 },
			{ x: 0, y: 3.14, z: 0 },
			{ x: 0, y: 0, z: 1 },
		)
		const ballImp = this.scene.physicsWorld.createImpulseJoint(
			ballJoint,
			lastBoneBody,
			this.modelBody,
		)

		this.baseImp.configureMotorVelocity(0, 1e2)
		// wireImp.configureMotorVelocity(0, 1e2)
		wireImp.setLimits(-1, 1)
		ballImp.configureMotorVelocity(0, 1e1)

		const bounds = new Vector2()
		this.experience.camera.instance.getViewSize(8, bounds)

		if (isMobile) {
			// create wall collider
			const wallBody = this.scene.physicsWorld.createRigidBody(
				RAPIER.RigidBodyDesc.fixed().setTranslation(-bounds.x / 2 - 3, 0, 0),
			)
			const wallShape = RAPIER.ColliderDesc.cuboid(1, 10, 1).setTranslation(0, 0, 0)
			this.scene.physicsWorld.createCollider(wallShape, wallBody)
			const wallBody2 = this.scene.physicsWorld.createRigidBody(
				RAPIER.RigidBodyDesc.fixed().setTranslation(bounds.x / 2 + 3, 0, 0),
			)
			const wallShape2 = RAPIER.ColliderDesc.cuboid(1, 10, 1).setTranslation(0, 0, 0)
			this.scene.physicsWorld.createCollider(wallShape2, wallBody2)

			return
		}

		const mouseBody = this.scene.physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.fixed())
		const mouseShape = RAPIER.ColliderDesc.ball(0.1).setTranslation(0, 0.2, 0)
		this.mouseCollider = this.scene.physicsWorld.createCollider(mouseShape, mouseBody)
		this.mouseCollider.setEnabled(false)

		// addEventListener('mousedown', (event) => {
		// 	//enable mouse physics
		// 	mouseCollider.setEnabled(true)
		// })

		// addEventListener('mouseup', (event) => {
		// 	mouseCollider.setEnabled(false)
		// })
		addEventListener('mousemove', (event) => {
			if (breakMode) {
				this.mouseCollider.setEnabled(false)
				return
			}

			// this.mouseCollider.setEnabled(true)
			const x = (event.clientX / window.innerWidth) * 2 - 1
			const y = -(event.clientY / window.innerHeight) * 2 + 1

			const vector = new Vector3(x * (bounds.x / 2), y * (bounds.y / 2) - 0.5, 0)

			mouseBody.setTranslation(vector, true)
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
