import { Raycaster, Vector2 } from 'three'
import Experience from 'core/Experience.js'

//TODO : drag

export default class InteractionManager {
	constructor(camera) {
		this.camera = camera
		this.experience = new Experience()
		this.sizes = this.experience.sizes

		this.raycaster = new Raycaster()
		this.pointer = new Vector2()

		this.#setEvents()

		this.interactiveObjects = []
		this.intersectsObjects = []
		this.previousHoveredObjects = []
		this.needsUpdate = false
	}

	#setEvents() {
		const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		)
		const handleMove = (event) => {
			if (event.touches) {
				this.pointer.x = (event.touches[0].clientX / this.sizes.width) * 2 - 1
				this.pointer.y = -(event.touches[0].clientY / this.sizes.height) * 2 + 1
			} else {
				this.pointer.x = (event.clientX / this.sizes.width) * 2 - 1
				this.pointer.y = -(event.clientY / this.sizes.height) * 2 + 1
			}

			this.needsUpdate = true

			if (this.dragObject) {
				this.dragObject.dispatchEvent({ type: 'drag', mouseEvent: event })
			}
		}
		if (isMobile) {
			addEventListener('touchmove', handleMove)
		} else {
			addEventListener('mousemove', handleMove)
		}

		const handleClick = (event) => {
			handleMove(event)

			this.update()
			if (!this.intersectsObjects.length) return
			this.intersectsObjects.forEach((object) => {
				object.dispatchEvent({ type: 'click' })
			})
		}

		if (isMobile) {
			addEventListener('touchstart', handleClick)
		} else {
			addEventListener('click', handleClick)
		}
		addEventListener('mousedown', (event) => {
			if (!this.intersectsObjects.length) return
			this.intersectsObjects.forEach((object) => {
				object.dispatchEvent({ type: 'mousedown' })
				this.dragObject = object
			})
		})

		addEventListener('mouseup', (event) => {
			this.interactiveObjects.forEach((object) => {
				object.dispatchEvent({ type: 'mouseup' })
				this.dragObject = null
			})
			// if (!this.intersectsObjects.length) return
			// this.intersectsObjects.forEach((object) => {
			// 	object.dispatchEvent({ type: 'mouseup' })
			// 	this.dragObject = null
			// })
		})
	}

	addInteractiveObject(object) {
		if (!this.interactiveObjects.includes(object)) this.interactiveObjects.push(object)
	}

	removeInteractiveObject(object) {
		this.interactiveObjects = this.interactiveObjects.filter((obj) => obj !== object)
	}

	update() {
		if (!this.needsUpdate || !this.interactiveObjects.length) return
		this.intersectsObjects = []

		this.raycaster.setFromCamera(this.pointer, this.camera)
		const intersects = this.raycaster.intersectObjects(this.interactiveObjects)

		intersects.forEach((intersect) => {
			const object = this.interactiveObjects.find(
				(obj) => {
					return obj.children.includes(intersect.object) || obj === intersect.object
				}
			)

			if (object && !this.intersectsObjects.includes(object)) {
				this.intersectsObjects.push(object)
				if (!object.isHovered) {
					object.dispatchEvent({ type: 'mouseover' })
					object.dispatchEvent({ type: 'mouseenter' })
					object.isHovered = true
				}
			}
		})

		// Dispatch mouseleave event for objects that are no longer intersected
		this.previousHoveredObjects.forEach((object) => {
			if (!this.intersectsObjects.includes(object)) {
				object.dispatchEvent({ type: 'mouseleave' })
				object.isHovered = false
			}
		})

		this.previousHoveredObjects = this.intersectsObjects
		// this.needsUpdate = false
	}
}
