import Experience from 'core/Experience.js'
import Environment from 'components/Environment.js'
import VAT from 'components/VAT'
import Resources from 'core/Resources.js'
import sources from './sources.json'
import RAPIER from '@dimforge/rapier3d-compat'
import { BufferGeometry, LineBasicMaterial, LineSegments, BufferAttribute } from 'three'

export default class Main {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.scene.resources = new Resources(sources)

		this.#initScene()
	}

	async #initScene() {
		await this.#initPhysics()
		this.scene.resources.on('ready', () => {
			this.environment = new Environment()
			this.vat = new VAT()
		})
		this.#createDebug()
	}

	async #initPhysics() {
		await RAPIER.init()
		const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0)
		this.scene.dynamicBodies = new Map()
		this.scene.physicsWorld = new RAPIER.World(gravity)

		// Create the ground
		// const groundBody = this.scene.physicsWorld.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -1, 0))
		// const groundShape = RAPIER.ColliderDesc.cuboid(10, 1, 10).setRestitution(1.1)
		// this.scene.physicsWorld.createCollider(groundShape, groundBody)
	}

	#createDebug() {
		const debugFolder = this.experience.debug.ui.addFolder({ title: 'Scene' })
	}

	update() {
		if (this.vat) this.vat.update()

		// Update physics
		if (this.scene.physicsWorld) {
			this.scene.physicsWorld.step()

			this.scene.dynamicBodies.forEach((body, mesh) => {
				mesh.position.copy(body.translation())
				mesh.quaternion.copy(body.rotation())
			})

			if (!this.lines) {
				const { vertices, colors } = this.scene.physicsWorld.debugRender()
				const geometry = new BufferGeometry()
				geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
				geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
				const material = new LineBasicMaterial({ vertexColors: true })
				this.lines = new LineSegments(geometry, material)
				this.scene.add(this.lines)
			}
			const { vertices, colors } = this.scene.physicsWorld.debugRender()
			this.lines.clear()
			this.lines.geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
			this.lines.geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3))
		}
	}
}
