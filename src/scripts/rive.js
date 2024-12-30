import { EventType } from '@rive-app/canvas'
import { Rive } from '@rive-app/canvas'
import { gsap } from 'gsap'

export default function createRive() {
	createMusic()
	createLoader()
	createButton()
}

function createMusic() {
	const musicRive = new Rive({
		src: '/rive/music_button.riv',
		canvas: document.getElementById('music_button'),
		autoplay: true,
		stateMachines: 'State Machine 1',
		onLoad: () => {
			// Ensure the drawing surface matches the canvas size and device pixel ratio
			musicRive.resizeDrawingSurfaceToCanvas()
		},
	})

	musicRive.on(EventType.RiveEvent, ({ data }) => {
		if (data.name === 'ClickEvent') {
			console.log('audio')
		}
	})
}

let progressInput
function createLoader() {
	const loaderRive = new Rive({
		src: '/rive/loader.riv',
		canvas: document.getElementById('loader'),
		autoplay: true,
		stateMachines: 'State Machine 1',
		onLoad: () => {
			// Ensure the drawing surface matches the canvas size and device pixel ratio
			loaderRive.resizeDrawingSurfaceToCanvas()
			const inputs = loaderRive.stateMachineInputs('State Machine 1')
			progressInput = inputs[0]
		},
	})
}

export function setProgress(progress) {
	if (progressInput) {
		progressInput.value = progress
	} else {
		console.warn('Progress input not found')
	}
}

export let breakMode = false
function createButton() {
	const buttonRive = new Rive({
		src: '/rive/button.riv',
		canvas: document.getElementById('button'),
		autoplay: true,
		stateMachines: 'State Machine 1',

		onLoad: () => {
			// Ensure the drawing surface matches the canvas size and device pixel ratio
			buttonRive.resizeDrawingSurfaceToCanvas()
			buttonRive.getTextRunValue('label')
			buttonRive.setTextRunValue('label', 'Break mode')

			addEventListener(
				'click',
				() => {
					// buttonRive.stateMachineInputs('State Machine 1')[0].fire()
					breakMode = true
				},
				{ once: true }
			)
		},
	})
}
