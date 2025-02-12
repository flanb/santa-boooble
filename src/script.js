import Experience from 'core/Experience.js'
import createCursor from './scripts/cursor'
import createRive from './scripts/rive'
import createTitle from './scripts/title'
import wordWrapper from 'word-wrapper'

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

	const paperContent = document.querySelector('.paper .content')
	const paperAuthor = document.querySelector('.paper .author')

	if (paperContent && paperAuthor) {
	}

	/**
	 * @type {HTMLCanvasElement}
	 */
	const paperCanvas = document.querySelector('#paper')
	paperCanvas.width = 1000 * 2.605
	paperCanvas.height = 1000
	const paperContext = paperCanvas.getContext('2d')
	paperContext.fillStyle = 'white'
	let textareaPaperText = 'Happy Holidays !'
	let inputPaperText = 'Santa'
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
	textareaPaperElement.addEventListener('input', (event) => {
		textareaPaperText = event.target.value
		updatePaperCanvas()
	})

	const inputPaperElement = document.querySelector('.paper-canvas input')
	inputPaperElement.addEventListener('input', (event) => {
		inputPaperText = event.target.value
		updatePaperCanvas()
	})
	// setTimeout(() => {
	// 	console.log('updateCanvas')
	// }, 5000)

	let cursorVisible = true
	setInterval(() => {
		cursorVisible = !cursorVisible
		updatePaperCanvas()
	}, 500)

	function drawCursor(context, x, y, height) {
		if (cursorVisible) {
			context.fillRect(x, y - height, 5, height)
		}
	}
})
let cursorTextareaActive = false
export function displayCursorTextarea(bool = true) {
	cursorTextareaActive = bool
}

let cursorInputActive = false
export function displayCursorInput(bool = true) {
	cursorInputActive = bool
}

let paperTextActive = false
export function displayPaperText(bool = true) {
	paperTextActive = bool
}
export function updatePaperCanvas() {
	if (!paperTextActive) return
	paperContext.clearRect(0, 0, paperCanvas.width, paperCanvas.height)
	paperContext.font = 'bold 128px cursive'
	paperContext.textAlign = 'center'
	// paperContext.textBaseline = 'middle'
	const textareaText = wordWrapper(textareaPaperText, { width: 40 })

	const textareaLines = textareaText.split('\n')

	const lineHeight = 150
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
		drawCursor(paperContext, cursorX, cursorY, 128)
	}

	paperContext.font = '64px cursive'
	paperContext.textAlign = 'end'

	paperContext.fillText(inputPaperText, paperCanvas.width - 200, paperCanvas.height - 150)
	if (cursorInputActive) {
		drawCursor(paperContext, paperCanvas.width - 200, paperCanvas.height - 150, 64)
	}

	window.canvasTexture.needsUpdate = true
}
