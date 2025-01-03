import { EventType } from '@rive-app/canvas'
import { Rive } from '@rive-app/canvas'
import { gsap } from 'gsap'
import { pushItTitle } from './title'

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
			buttonRive.setTextRunValue('label', 'Break this !!')

			gsap.set(buttonRive.canvas, {
				autoAlpha: 0,
			})

			const click = () => {
				pushItTitle()

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
		const content = document.querySelector('.content')
		const author = document.querySelector('.author')
		content.setAttribute('contenteditable', true)
		author.setAttribute('contenteditable', true)
		content.focus()
		// setTimeout(() => {
		// 	buttonRive.stateMachineInputs('State Machine 1')[1].value = false
		// }, 500)

		buttonRive.setTextRunValue('label', 'Send it !')

		const secondClick = () => {
			//share api
			const message = content.innerText
			const messageAuthor = author.innerText
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
		buttonRive.canvas.addEventListener('click', secondClick)
		buttonRive.canvas.addEventListener('touchend', secondClick)
	}
	buttonRive.canvas.addEventListener('click', firstClick, { once: true })
	buttonRive.canvas.addEventListener('touchend', firstClick, { once: true })
}
