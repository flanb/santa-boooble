import Experience from 'core/Experience.js'
import Environment from 'components/Environment.js'
import VAT from 'components/VAT'
import Resources from 'core/Resources.js'
import sources from './sources.json'
import RAPIER from '@dimforge/rapier3d-compat'

export default class Main {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.scene.resources = new Resources(sources)

		// Wait for resources
		this.scene.resources.on('ready', () => {
			// Setup
			this.environment = new Environment()
			this.vat = new VAT()
			this.#initPhysics()
		})
	}

	async #initPhysics() {
		await RAPIER.init()
		const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0)
		this.dynamicBodies = []
		this.world = new RAPIER.World(gravity)

		// Create the ground
		const groundBody = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -1, 0))
		const groundShape = RAPIER.ColliderDesc.cuboid(10, 1, 10).setRestitution(1.1)
		this.world.createCollider(groundShape, groundBody)

		// Create VAT body
		const cubeBody = this.world.createRigidBody(
			RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 5, 0).setCanSleep(false)
		)
		const cubeShape = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
		this.world.createCollider(cubeShape, cubeBody)
		this.dynamicBodies.push([this.vat.model, cubeBody])
	}

	update() {
		if (this.vat) this.vat.update()

		// Update physics
		if (this.world) {
			this.world.step()
			for (let i = 0, n = this.dynamicBodies.length; i < n; i++) {
				this.dynamicBodies[i][0].position.copy(this.dynamicBodies[i][1].translation())
				this.dynamicBodies[i][0].quaternion.copy(this.dynamicBodies[i][1].rotation())
			}
		}
	}
}
