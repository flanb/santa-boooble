import RAPIER from '@dimforge/rapier3d-compat'
import Environment from 'components/Environment.js'
import VAT from 'components/VAT'
import Experience from 'core/Experience.js'
import Resources from 'core/Resources.js'
import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, Mesh } from 'three'
import sources from './sources.json'
import Paper from '@/webgl/components/Paper'
import Text from 'components/Text.js'

export default class Main {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.scene.resources = new Resources(sources)
		this.scene.enablePhysics = true

		this.#initScene()
	}

	async #initScene() {
		await this.#initPhysics()
		this.scene.resources.on('ready', () => {
			this.environment = new Environment()
			this.vat = new VAT()
			this.paper = new Paper(this.vat)
			this.text = new Text()
		})
	}

	async #initPhysics() {
		await RAPIER.init()
		const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0)
		/**
		 * @type {Map<Mesh, RAPIER.RigidBody>}
		 */
		this.scene.dynamicBodies = new Map()
		this.scene.physicsWorld = new RAPIER.World(gravity)

		const groundBody = this.scene.physicsWorld.createRigidBody(
			RAPIER.RigidBodyDesc.fixed().setTranslation(0, 6, 0),
		)
		const groundShape = RAPIER.ColliderDesc.cuboid(10, 1, 10)
		this.scene.physicsWorld.createCollider(groundShape, groundBody)

		setInterval(() => {
			if (!this.scene.enablePhysics) return
			requestAnimationFrame(() => {
				this.scene.physicsWorld.step()
			})
		}, 1000 / 60)
	}

	update() {
		if (this.vat) this.vat.update()

		if (this.experience?.gimbal?.isEnable && this.scene.physicsWorld) {
			//change gravity
			const gravity = new RAPIER.Vector3(-this.experience.gimbal.yaw * 5, -9.81, 0)

			this.scene.physicsWorld.gravity = gravity
		}

		// Update physics
		if (this.scene.physicsWorld) {
			this.scene.dynamicBodies.forEach((body, mesh) => {
				const parent = mesh.parent
				this.scene.attach(mesh)
				const translation = body.translation()
				mesh.position.copy(translation)

				if (mesh.noRotation) return
				const rotation = body.rotation()
				mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
				parent.attach(mesh)
			})

			// if (!this.lines) {
			// 	const { vertices, colors } = this.scene.physicsWorld.debugRender()
			// 	const geometry = new BufferGeometry()
			// 	geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
			// 	geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
			// 	const material = new LineBasicMaterial({ vertexColors: true })
			// 	this.lines = new LineSegments(geometry, material)
			// 	this.scene.add(this.lines)
			// }
			// const { vertices, colors } = this.scene.physicsWorld.debugRender()
			// this.lines.clear()
			// this.lines.geometry.setAttribute(
			// 	'position',
			// 	new BufferAttribute(new Float32Array(vertices), 3),
			// )
			// this.lines.geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
		}
	}
}
