import addObjectDebug from '@/webgl/utils/addObjectDebug'
import Experience from 'core/Experience.js'
import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, Vector2 } from 'three'
import wordWrapper from 'word-wrapper'

export default class Text {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.resources = this.scene.resources

		this.#createMaterial()
		this.#createModel()
		if (this.experience.debug.active) this.#createDebug()
	}

	#createModel() {
		const min = new Vector2()
		const max = new Vector2()
		const distance = this.experience.camera.instance.position.z + 1
		this.experience.camera.instance.getViewBounds(distance, min, max)
		const geometry = new PlaneGeometry(max.x - min.x, max.x - min.x)

		this.model = new Mesh(geometry, this.material)
		this.model.name = 'text'
		this.model.position.set(0, 0, -1)
		this.scene.add(this.model)
	}

	#createMaterial() {
		// canvas 2d with a text
		const canvas = document.createElement('canvas')
		const context = canvas.getContext('2d')
		canvas.width = 1024
		canvas.height = 1024
		context.fillStyle = 'black'
		context.font = 'italic 100px Pangaia'
		context.textAlign = 'center'
		context.textBaseline = 'middle'
		context.letterSpacing = '-2px'

		const text = wordWrapper("Love isn't something you find, it's something that finds you.", {
			width: 24,
		})

		const lines = text.split('\n')
		const lineHeight = 100
		const totalTextHeight = lines.length * lineHeight
		const startY = (canvas.height - totalTextHeight) / 2 + lineHeight / 2
		lines.forEach((line, index) => {
			context.fillText(line, canvas.width / 2, startY + index * lineHeight)
		})
		const texture = new CanvasTexture(canvas)

		this.material = new MeshBasicMaterial({
			map: texture,
			alphaTest: 0.5,
		})
	}

	#createDebug() {
		const debugFolder = addObjectDebug(this.experience.debug.ui, this.model)
	}
}
