import Experience from 'core/Experience.js'
import { EquirectangularReflectionMapping, PMREMGenerator, RectAreaLight, SpotLight } from 'three'
import { DirectionalLight, Mesh, MeshStandardMaterial, SRGBColorSpace } from 'three'
import addObjectDebug from 'utils/addObjectDebug.js'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'

export default class Environment {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.resources = this.scene.resources
		this.debug = this.experience.debug

		// Debug
		if (this.debug.active) {
			this.environmentDebugFolder = this.debug.ui.addFolder({
				title: 'environment',
				expanded: false,
			})
		}

		// this.setSunLight()
		this.setEnvironmentMap()
	}

	setSunLight() {
		RectAreaLightUniformsLib.init()
		this.sunLight = new RectAreaLight('#ffffff', 4)
		this.sunLight.position.set(-12, 4, -4)
		this.sunLight.lookAt(0, 0, 0)
		this.sunLight.name = 'sunLight'
		this.scene.add(this.sunLight)

		this.backLight = new RectAreaLight('#ffffff', 10)
		this.backLight.position.set(15, -0, 2)
		this.backLight.lookAt(0, 0, 0)
		this.backLight.name = 'backLight'
		this.scene.add(this.backLight)

		// Debug
		if (this.debug.active) {
			const debugFolder = addObjectDebug(this.environmentDebugFolder, this.sunLight)
			addObjectDebug(this.environmentDebugFolder, this.backLight)
		}
	}

	setEnvironmentMap() {
		this.environmentMap = {}
		// this.environmentMap.intensity = 2
		this.environmentMap.texture = this.resources.items.environmentMapTexture
		// this.environmentMap.texture.encoding = SRGBColorSpace
		// this.environmentMap.texture.mapping = EquirectangularReflectionMapping

		const pmremGenerator = new PMREMGenerator(this.experience.renderer.instance)
		const envMap = pmremGenerator.fromEquirectangular(this.environmentMap.texture).texture
		this.environmentMap.texture.dispose()

		this.scene.environment = envMap
		// this.scene.background = this.environmentMap.texture

		// this.environmentMap.updateMaterials = () => {
		// 	this.scene.traverse((child) => {
		// 		if (child instanceof Mesh && child.material instanceof MeshStandardMaterial) {
		// 			child.material.envMap = this.environmentMap.texture
		// 			child.material.envMapIntensity = this.environmentMap.intensity
		// 			child.material.needsUpdate = true
		// 		}
		// 	})
		// }
		// this.environmentMap.updateMaterials()

		// Debug
		// if (this.debug.active) {
		// 	this.environmentDebugFolder.addBinding(this.environmentMap, 'intensity', {
		// 		min: 0,
		// 		max: 4,
		// 		step: 0.001,
		// 		label: 'envMapIntensity',
		// 	})
		// 	// .on('change', this.environmentMap.updateMaterials)
		// }
	}
}
