import Experience from 'core/Experience.js'
import createCursor from './scripts/cursor'
import createRive from './scripts/rive'
import wordWrapper from 'word-wrapper'
import gsap from 'gsap'

setTimeout(() => {
	const experience = new Experience(document.querySelector('canvas#webgl'))

	createCursor()
	createRive()
	// createTitle()

	const permissionButton = document.querySelector('.permission')
	if (permissionButton) {
		permissionButton.addEventListener('click', () => {
			experience.gimbal.enable()
			permissionButton.remove()
			document.querySelector('.permission-container').remove()
		})
	}
})

gsap.set(document.body, {
	background: 'radial-gradient(circle, rgb(255, 50, 50) -200%, rgb(255, 255, 255) 80%)',
})
const paperContent = document.querySelector('.paper .content')
const paperAuthor = document.querySelector('.paper .author')
//
// if (paperContent && paperAuthor) {
// }
//
// /**
//  * @type {HTMLCanvasElement}
//  */
const paperCanvas = document.querySelector('#paper')
paperCanvas.width = 1000 * 1.538869258
paperCanvas.height = 1000
const paperContext = paperCanvas.getContext('2d')
paperContext.fillStyle = 'white'
paperContext.fillRect(0, 0, paperCanvas.width, paperCanvas.height)
paperContext.fillStyle = 'black'
paperContext.font = 'italic 48px Pangaia'
// paperContext.textAlign = 'center'
// paperContext.textBaseline = 'middle'
let textareaPaperText = "Happy Valentine's Day!"
let inputPaperText = 'Cupidon'
const url = new URL(location.href)
const message = url.searchParams.get('m')
const author = url.searchParams.get('a')
if (message && author) {
	textareaPaperText = atob(message)
	inputPaperText = atob(author)
}

/**
 * @type {HTMLInputElement}
 */
const textareaPaperElement = document.querySelector('.paper-canvas textarea')
// textareaPaperElement.value = textareaPaperText
textareaPaperElement.addEventListener('input', (event) => {
	textareaPaperText = event.target.value
	updatePaperCanvas()
})

const inputPaperElement = document.querySelector('.paper-canvas input')
// inputPaperElement.value = inputPaperText
inputPaperElement.addEventListener('input', (event) => {
	inputPaperText = event.target.value
	updatePaperCanvas()
})

let cursorVisible = true
// setInterval(() => {
// 	cursorVisible = !cursorVisible
// 	// updatePaperCanvas()
// }, 500)

function drawCursor(context, x, y, height) {
	if (cursorVisible) {
		context.fillRect(x, y - height, 4, height)
	}
}
let cursorTextareaActive = false
export function displayCursorTextarea(bool = true) {
	cursorTextareaActive = bool
}

let cursorInputActive = false
export function displayCursorInput(bool = true) {
	cursorInputActive = bool
}

let paperTextActive = false
let cursorInterval = null
export function displayPaperText(bool = true) {
	paperTextActive = bool
	updatePaperCanvas()
	if (!cursorInterval) {
		const button = document.querySelector('.primary-button')
		button.innerText = 'Write a message !'
		gsap.to(button, {
			autoAlpha: 1,
			duration: 0.5,
		})
		button.addEventListener(
			'click',
			() => {
				displayCursorTextarea()
				textareaPaperElement.style.display = 'block'
				textareaPaperElement.value = ''
				textareaPaperText = ''
				textareaPaperElement.focus()
				gsap.to(button, {
					autoAlpha: 0,
					onComplete: () => {
						button.innerText = 'Sign !'
						gsap.to(button, {
							autoAlpha: 1,
							delay: 1,
							onComplete: () => {
								button.addEventListener(
									'click',
									() => {
										displayCursorTextarea(false)
										textareaPaperElement.style.display = ''
										displayCursorInput()
										inputPaperElement.style.display = 'block'
										inputPaperElement.value = ''
										inputPaperText = ''
										inputPaperElement.focus()
										gsap.to(button, {
											autoAlpha: 0,
											onComplete: () => {
												button.innerText = 'Send your love message!'
												gsap.to(button, {
													autoAlpha: 1,
													delay: 1,
													onComplete: () => {
														button.addEventListener(
															'click',
															() => {
																window.flyLetter()
																clearInterval(cursorInterval)
																cursorInterval = null
																inputPaperElement.style.display = ''
																const message = btoa(
																	textareaPaperText.replace(/[^a-zA-Z0-9]/gm, ''),
																)
																const author = btoa(inputPaperText.replace(/[^a-zA-Z0-9]/gm, ''))
																navigator.clipboard.writeText(
																	`${location.origin}?m=${message}&a=${author}`,
																)
																gsap.to(button, {
																	autoAlpha: 0,
																})
															},
															{ once: true },
														)
													},
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
			{ once: true },
		)
		cursorInterval = setInterval(() => {
			cursorVisible = !cursorVisible
			updatePaperCanvas()
		}, 500)
	}
}
const fontSize = 64
export function updatePaperCanvas() {
	if (!paperTextActive) return
	paperContext.clearRect(0, 0, paperCanvas.width, paperCanvas.height)
	paperContext.fillStyle = 'white'
	paperContext.fillRect(0, 0, paperCanvas.width, paperCanvas.height)
	paperContext.fillStyle = 'black'
	paperContext.font = `italic ${fontSize}px Pangaia`
	paperContext.textAlign = 'center'
	const textareaText = wordWrapper(textareaPaperText, { width: 45 })

	const textareaLines = textareaText.split('\n')

	const lineHeight = fontSize
	const totalTextHeight = textareaLines.length * lineHeight
	const startY = (paperCanvas.height - totalTextHeight) / 2 + lineHeight / 2

	textareaLines.forEach((line, index) => {
		paperContext.fillText(line, paperCanvas.width / 2, startY + index * lineHeight)
	})

	const lastLine = textareaLines[textareaLines.length - 1]
	const lastLineWidth = paperContext.measureText(lastLine).width
	const cursorX = paperCanvas.width / 2 + lastLineWidth / 2 + 10
	const cursorY = startY + (textareaLines.length - 1) * lineHeight

	if (cursorTextareaActive) {
		drawCursor(paperContext, cursorX, cursorY, fontSize)
	}

	paperContext.font = '48px Pangaia'
	paperContext.textAlign = 'end'

	paperContext.fillText(inputPaperText, paperCanvas.width - 100, paperCanvas.height - 75)
	if (cursorInputActive) {
		drawCursor(paperContext, paperCanvas.width - 100, paperCanvas.height - 75, 64)
	}

	window.canvasTexture.needsUpdate = true
}
