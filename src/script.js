import Experience from 'core/Experience.js'

const experience = new Experience(document.querySelector('canvas#webgl'))

function customCursor() {
	const cursor = document.querySelector('.cursor-container')
	let mouseX = 0,
		mouseY = 0,
		cursorX = 0,
		cursorY = 0
	const speed = 0.5

	document.addEventListener('mousemove', (event) => {
		mouseX = event.clientX
		mouseY = event.clientY
	})

	function animate() {
		cursorX += (mouseX - cursorX) * speed
		cursorY += (mouseY - cursorY) * speed
		cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`
		requestAnimationFrame(animate)
	}

	animate()
}

customCursor()
