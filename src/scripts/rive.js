import { Rive, EventType } from '@rive-app/canvas'
import { gsap } from 'gsap'
import { lerp } from 'three/src/math/MathUtils'

export default function createRive() {
	createMusic()
	// createButton()
	handleButton()
}

function handleButton() {
	const primaryButton = document.querySelector('.primary-button')
	const secondaryButton = document.querySelector('.secondary-button')

	primaryButton.addEventListener(
		'click',
		() => {
			breakMode = true
			window.shatter()
			gsap.to(primaryButton, {
				autoAlpha: 0,
				duration: 0.5,
			})
		},
		{ once: true },
	)
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
			// console.log('audio')
		}
	})
}

// let progressInput
// function createLoader() {
// 	const loaderRive = new Rive({
// 		src: '/rive/loader.riv',
// 		canvas: document.getElementById('loader'),
// 		autoplay: true,
// 		stateMachines: 'State Machine 1',
// 		onLoad: () => {
// 			// Ensure the drawing surface matches the canvas size and device pixel ratio
// 			loaderRive.resizeDrawingSurfaceToCanvas()
// 			const inputs = loaderRive.stateMachineInputs('State Machine 1')
// 			progressInput = inputs[0]
// 		},
// 	})
// }

const waveElement = document.querySelector('.wave')
const loaderSvgElement = document.querySelector('.loader-svg')
let targetWaveProgress = 0
export function setProgress(progress) {
	targetWaveProgress = progress
}

function waveProgressTick() {
	waveElement.style.setProperty(
		'--wave-progress',
		lerp(waveElement.style.getPropertyValue('--wave-progress'), targetWaveProgress, 0.1),
	)

	if (waveElement.style.getPropertyValue('--wave-progress') < 0.99) {
		requestAnimationFrame(waveProgressTick)
	} else {
		loaderSvgElement.classList.add('rotate-anim')

		gsap.to(['.star3', '.star2', '.star1'], {
			keyframes: {
				autoAlpha: [0, 1, 0],
			},
			stagger: 0.1,
		})
	}
}
requestAnimationFrame(waveProgressTick)

export let breakMode = false

export function toggleBreakMode(value) {
	breakMode = value
}
let buttonRive
function createButton() {
	buttonRive = new Rive({
		src: '/rive/button.riv',
		canvas: document.getElementById('button'),
		autoplay: true,
		stateMachines: 'State Machine 1',

		onLoad: () => {
			// Ensure the drawing surface matches the canvas size and device pixel ratio
			buttonRive.resizeDrawingSurfaceToCanvas()
			requestAnimationFrame(() => {
				// buttonRive.setTextRunValue('label', 'Someone is looking for you, open it')
			})

			// gsap.set(buttonRive.canvas, {
			// 	autoAlpha: 0,
			// })

			const click = () => {
				// pushItTitle()

				// setTimeout(() => {
				// 	buttonRive.stateMachineInputs('State Machine 1')[1].value = false
				// }, 500)
				breakMode = true
				//delete button
				gsap.to(buttonRive.canvas, {
					autoAlpha: 0,
					duration: 0.5,
					onComplete: () => {
						// buttonRive.cleanup()
						// buttonRive.canvas.remove()
					},
				})
			}
			buttonRive.canvas.addEventListener('touchend', click, { once: true })
			buttonRive.canvas.addEventListener('click', click, { once: true })
		},
	})
}

export function displayButton() {
	gsap.to(buttonRive.canvas, {
		autoAlpha: 1,
		duration: 0.5,
	})
}

export function displayWriteButton() {
	buttonRive.setTextRunValue('label', 'Write a message !')
	gsap.to(buttonRive.canvas, {
		autoAlpha: 1,
		duration: 0.5,
	})

	const firstClick = () => {
		//focus on input make content editable
		const textareaElement = document.querySelector('.paper-canvas textarea')
		const inputElement = document.querySelector('.paper-canvas input')
		textareaElement.focus()
		textareaElement.value = ''
		textareaElement.dispatchEvent(new Event('input'))
		displayCursorTextarea()
		// setTimeout(() => {
		// 	buttonRive.stateMachineInputs('State Machine 1')[1].value = false
		// }, 500)

		buttonRive.setTextRunValue('label', 'Sign !')

		const secondClick = () => {
			gsap.set('.paper-canvas textarea', {
				display: 'none',
			})
			gsap.set('.paper-canvas input', {
				display: 'block',
			})
			inputElement.focus()
			inputElement.value = ''
			inputElement.dispatchEvent(new Event('input'))
			displayCursorTextarea(false)
			displayCursorInput()

			buttonRive.setTextRunValue('label', 'Share !')

			const thirdClick = () => {
				//share api
				const message = textareaElement.value
				const messageAuthor = inputElement.value
				// setTimeout(() => {
				// 	buttonRive.stateMachineInputs('State Machine 1')[1].value = false
				// }, 500)
				const url = new URL(location.href)
				url.searchParams.append('m', btoa(message))
				url.searchParams.append('a', btoa(messageAuthor))

				const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
				if (navigator.share && isMobile) {
					navigator
						.share({
							url,
						})
						.catch(console.error)
				} else {
					navigator.clipboard.writeText(url)
					alert('url copied')
				}
			}

			buttonRive.canvas.addEventListener('click', thirdClick)
			buttonRive.canvas.addEventListener('touchend', thirdClick)
		}

		buttonRive.canvas.addEventListener('click', secondClick, { once: true })
		buttonRive.canvas.addEventListener('touchend', secondClick, { once: true })
	}
	buttonRive.canvas.addEventListener('click', firstClick, { once: true })
	buttonRive.canvas.addEventListener('touchend', firstClick, { once: true })
}
