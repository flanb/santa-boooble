import addObjectDebug from '@/webgl/utils/addObjectDebug'
import Experience from 'core/Experience.js'
import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, Vector2 } from 'three'
import wordWrapper from 'word-wrapper'
import gsap from 'gsap'

let canvas = null
let context = null
export default class Text {
	constructor() {
		this.experience = new Experience()
		this.scene = this.experience.scene
		this.resources = this.scene.resources

		this.#createMaterial()
		this.#createModel()
		if (this.experience.debug.active) this.#createDebug()
		window.shatter = this.shatter
		window.air = this.air
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

	#generateTextTexture(prop) {
		if (!canvas) {
			canvas = document.createElement('canvas')
			context = canvas.getContext('2d')
			canvas.width = 1024
			canvas.height = 1024
		}
		context.clearRect(0, 0, canvas.width, canvas.height)
		context.fillStyle = 'black'
		context.font = 'italic 100px Pangaia'
		context.textAlign = 'center'
		context.textBaseline = 'middle'
		// context.letterSpacing = '-2px'

		const text = wordWrapper(prop, {
			width: 24,
		})

		const lines = text.split('\n')
		const lineHeight = 100
		const totalTextHeight = lines.length * lineHeight
		const startY = (canvas.height - totalTextHeight) / 2 + lineHeight / 2
		lines.forEach((line, index) => {
			context.fillText(line, canvas.width / 2, startY + index * lineHeight)
		})
		return canvas
	}

	#createMaterial() {
		// canvas 2d with a text

		const texture = new CanvasTexture(
			this.#generateTextTexture("Love isn't something you find, it's something that finds you."),
		)

		this.material = new MeshBasicMaterial({
			map: texture,
			alphaTest: 0.5,
		})
	}

	shatter = () => {
		gsap.to(this.model.position, {
			y: 4,
			duration: 1,
			ease: 'power2.in',
			onComplete: () => {
				this.material.map = new CanvasTexture(
					this.#generateTextTexture('Shatter the Heart to uncover a Mystery..'),
				)
				gsap.set(this.model.position, {
					y: -4,
				})
				gsap.to(this.model.position, {
					y: 0,
					duration: 1,
					ease: 'power2.out',
				})
			},
		})
	}

	air = () => {
		gsap.to(this.model.position, {
			y: 4,
			duration: 1,
			ease: 'power2.in',
			onComplete: () => {
				this.material.map = new CanvasTexture(
					this.#generateTextTexture('Don’t forget to share it with your... crush ?'),
				)
				gsap.set(this.model.position, {
					y: -4,
				})
				gsap.to(this.model.position, {
					y: 0,
					duration: 1,
					ease: 'power2.out',
					onComplete: () => {
						const button = document.querySelector('.primary-button')
						button.innerText = 'Gather your courage & share it !'
						gsap.to(button, {
							autoAlpha: 1,
							duration: 0.5,
							onComplete: () => {
								button.addEventListener(
									'click',
									() => {
										gsap.to(button, {
											autoAlpha: 0,
											duration: 0.5,
										})
										gsap.to(this.model.position, {
											y: 4,
											duration: 1,
											ease: 'power2.in',
											onComplete: () => {
												gsap.to('.finish', {
													autoAlpha: 1,
													duration: 1,
												})
											},
										})
									},
									{ once: true },
								)
							},
						})
					},
				})
			},
		})
	}

	#createDebug() {
		const debugFolder = addObjectDebug(this.experience.debug.ui, this.model)
	}
}
